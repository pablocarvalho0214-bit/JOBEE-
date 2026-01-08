
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") as string, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");

    if (!signature) {
        return new Response("No signature provided", { status: 400 });
    }

    try {
        const body = await req.text();
        let event;

        try {
            // Use the async construct event with the specific crypto provider passed directly if needed,
            // but actually, the cleanest way in Deno is often just this:
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                endpointSecret,
                undefined,
                cryptoProvider
            );
        } catch (err: any) {
            console.error(`⚠️  Webhook signature verification failed.`, err.message);
            return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        console.log(`🔔  Event received: ${event.type}`);

        // Handle events
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const userId = session.client_reference_id;
                const subscriptionId = session.subscription;
                const customerId = session.customer;

                if (userId) {
                    console.log(`✅ Payment success for User: ${userId}`);

                    // Determine tier based on subscription amount
                    let tier = 'nectar';

                    if (subscriptionId) {
                        try {
                            const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
                            const amount = subscription.items.data[0]?.price.unit_amount || 0;

                            // Map amounts (in cents) to tier names
                            // R$ 29,90 = 2990 cents = Pólen
                            // R$ 59,90 = 5990 cents = Favo de Ouro  
                            // R$ 99,90 = 9990 cents = Geleia Real
                            if (amount === 2990) {
                                tier = 'polen';
                            } else if (amount === 5990) {
                                tier = 'favo';
                            } else if (amount === 9990) {
                                tier = 'geleia';
                            }

                            console.log(`📦 Detected tier: ${tier} from amount: ${amount} cents`);
                        } catch (err) {
                            console.error('Error retrieving subscription:', err);
                        }
                    }

                    await supabase
                        .from("profiles")
                        .update({
                            subscription_status: "active",
                            subscription_tier: tier,
                            subscription_id: subscriptionId,
                            stripe_customer_id: customerId,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", userId);
                }
                break;
            }
            case "invoice.payment_succeeded": {
                const invoice = event.data.object;
                const subscriptionId = invoice.subscription;
                const customerId = invoice.customer;

                // Simple renewal logic
                await supabase
                    .from("profiles")
                    .update({
                        subscription_status: "active",
                        updated_at: new Date().toISOString()
                    })
                    .eq("stripe_customer_id", customerId);
                break;
            }
            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                await supabase
                    .from("profiles")
                    .update({
                        subscription_status: "free",
                        subscription_id: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq("stripe_customer_id", customerId);
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (err: any) {
        console.error("Internal Error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
