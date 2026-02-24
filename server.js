import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import { config } from "dotenv";

config();

// ============================================
// Firebase Admin SDK Initialization
// ============================================
let db;
try {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Option 1: Inline JSON string (for cloud hosting like Render)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else if (
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH &&
    existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  ) {
    // Option 2: File path
    serviceAccount = JSON.parse(
      readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8")
    );
  } else if (existsSync("./serviceAccountKey.json")) {
    // Option 3: Default file
    serviceAccount = JSON.parse(
      readFileSync("./serviceAccountKey.json", "utf8")
    );
  } else {
    throw new Error(
      "Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH"
    );
  }

  initializeApp({
    credential: cert(serviceAccount),
  });

  db = getFirestore();
  console.log("[server] Firebase Admin initialized successfully");
} catch (error) {
  console.error("[server] Firebase Admin initialization error:", error.message);
  process.exit(1);
}

// ============================================
// Stripe Initialization
// ============================================
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("[server] STRIPE_SECRET_KEY is not set in .env");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ============================================
// Express App Setup
// ============================================
const app = express();

// CORS - Allow your frontend domains
const allowedOrigins = [
  "https://www.georgiatrips.ge",
  "https://georgiatrips.ge",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:8080",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// IMPORTANT: Webhook endpoint needs raw body for signature verification
// So we parse JSON for all routes EXCEPT /webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// ============================================
// Health Check
// ============================================
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "GeorgiaTrips Payment Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// POST /create-checkout-session
// Creates a Stripe Checkout Session from booking data
// ============================================
app.post("/create-checkout-session", async (req, res) => {
  try {
    const {
      itemType,
      itemId,
      itemName,
      itemImage,
      itemRegion,
      itemRegions,
      startDate,
      endDate,
      duration,
      peopleCount,
      pricePerPersonPerDay,
      tourPrice,
      totalPrice,
      currency,
      contactName,
      contactSurname,
      contactEmail,
      contactPhone,
      contactDescription,
      userId,
      userEmail,
      isGuest,
      selectedHotel,
      selectedDates,
    } = req.body;

    // Validate required fields
    if (!contactName || !contactSurname || !contactEmail || !contactPhone) {
      return res
        .status(400)
        .json({ error: "All contact fields are required" });
    }

    if (!startDate) {
      return res.status(400).json({ error: "Start date is required" });
    }

    if (!itemName || !totalPrice) {
      return res
        .status(400)
        .json({ error: "Tour name and price are required" });
    }

    // Stripe currency mapping
    // GEL (Georgian Lari) is supported by Stripe as "gel"
    const stripeCurrency = (currency || "GEL").toLowerCase();
    const currencySymbol =
      currency === "USD" ? "$" : currency === "EUR" ? "\u20AC" : "\u20BE";

    // Build line items
    const lineItems = [];

    // Tour line item
    lineItems.push({
      price_data: {
        currency: stripeCurrency,
        product_data: {
          name: itemName,
          description: `${peopleCount} person(s) x ${duration} day(s) | ${startDate}${endDate && endDate !== startDate ? " - " + endDate : ""}`,
          ...(itemImage && { images: [itemImage] }),
        },
        unit_amount: Math.round(tourPrice * 100), // Convert to smallest unit (tetri/cents)
      },
      quantity: 1,
    });

    // Hotel line item (if selected)
    if (selectedHotel && selectedHotel.totalHotelPrice > 0) {
      const hotelCurrency = (selectedHotel.currency || currency || "GEL").toLowerCase();
      lineItems.push({
        price_data: {
          currency: hotelCurrency,
          product_data: {
            name: `Hotel: ${selectedHotel.name}`,
            description: `${duration} night(s) accommodation`,
          },
          unit_amount: Math.round(selectedHotel.totalHotelPrice * 100),
        },
        quantity: 1,
      });
    }

    // Store all booking data in metadata (Stripe metadata values must be strings, max 500 chars each)
    const metadata = {
      itemType: String(itemType || ""),
      itemId: String(itemId || ""),
      itemName: String(itemName || ""),
      itemImage: String(itemImage || "").substring(0, 500),
      itemRegion: String(itemRegion || ""),
      startDate: String(startDate || ""),
      endDate: String(endDate || ""),
      duration: String(duration || 1),
      peopleCount: String(peopleCount || 1),
      pricePerPersonPerDay: String(pricePerPersonPerDay || 0),
      tourPrice: String(tourPrice || 0),
      totalPrice: String(totalPrice || 0),
      currency: String(currency || "GEL"),
      contactName: String(contactName || ""),
      contactSurname: String(contactSurname || ""),
      contactEmail: String(contactEmail || ""),
      contactPhone: String(contactPhone || ""),
      contactDescription: String(contactDescription || "").substring(0, 500),
      userId: String(userId || ""),
      userEmail: String(userEmail || ""),
      isGuest: String(isGuest || false),
    };

    // Store hotel and dates as JSON in metadata (within 500 char limit)
    if (selectedHotel) {
      metadata.selectedHotel = JSON.stringify(selectedHotel).substring(0, 500);
    }
    if (selectedDates && selectedDates.length > 0) {
      metadata.selectedDates = JSON.stringify(selectedDates).substring(0, 500);
    }
    if (itemRegions && itemRegions.length > 0) {
      metadata.itemRegions = JSON.stringify(itemRegions).substring(0, 500);
    }

    // Determine frontend URL for redirects
    const frontendUrl =
      process.env.FRONTEND_URL || "https://www.georgiatrips.ge";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: contactEmail,
      line_items: lineItems,
      metadata: metadata,
      success_url: `${frontendUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/full-tours.html`,
      locale: "auto",
    });

    console.log(
      `[server] Checkout session created: ${session.id} for ${itemName}`
    );

    res.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("[server] Error creating checkout session:", error);
    res.status(500).json({
      error: "Failed to create checkout session",
      details: error.message,
    });
  }
});

// ============================================
// POST /webhook
// Stripe Webhook - saves booking to Firestore after payment
// ============================================
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (webhookSecret) {
        // Verify webhook signature (recommended for production)
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // For testing without webhook secret
        console.warn(
          "[server] WARNING: No STRIPE_WEBHOOK_SECRET set. Skipping signature verification."
        );
        event = JSON.parse(req.body);
      }
    } catch (err) {
      console.error("[server] Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log(
        `[server] Payment successful for session: ${session.id}`
      );

      try {
        const meta = session.metadata;

        // Build booking data (same structure as original frontend code)
        const bookingData = {
          itemType: meta.itemType || "tours",
          itemId: meta.itemId || "",
          itemName: meta.itemName || "",
          itemImage: meta.itemImage || "",
          itemRegion: meta.itemRegion || "",
          itemRegions: meta.itemRegions
            ? JSON.parse(meta.itemRegions)
            : [],
          startDate: meta.startDate || "",
          endDate: meta.endDate || meta.startDate || "",
          duration: parseInt(meta.duration) || 1,
          peopleCount: parseInt(meta.peopleCount) || 1,
          pricePerPersonPerDay: parseFloat(meta.pricePerPersonPerDay) || 0,
          tourPrice: parseFloat(meta.tourPrice) || 0,
          totalPrice: parseFloat(meta.totalPrice) || 0,
          currency: meta.currency || "GEL",
          status: "paid",
          paymentStatus: "completed",
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          createdAt: FieldValue.serverTimestamp(),
          contactName: meta.contactName || "",
          contactSurname: meta.contactSurname || "",
          contactEmail: meta.contactEmail || "",
          contactPhone: meta.contactPhone || "",
          contactDescription: meta.contactDescription || "",
          contactInfo: {
            firstName: meta.contactName || "",
            lastName: meta.contactSurname || "",
            email: meta.contactEmail || "",
            phone: meta.contactPhone || "",
          },
        };

        // Add user info if logged in
        if (meta.userId && meta.userId !== "" && meta.userId !== "undefined") {
          bookingData.userId = meta.userId;
        }
        if (
          meta.userEmail &&
          meta.userEmail !== "" &&
          meta.userEmail !== "undefined"
        ) {
          bookingData.userEmail = meta.userEmail;
        }
        if (meta.isGuest === "true") {
          bookingData.isGuest = true;
        }

        // Add selected hotel info
        if (meta.selectedHotel) {
          try {
            bookingData.selectedHotel = JSON.parse(meta.selectedHotel);
          } catch (e) {
            console.warn("[server] Could not parse selectedHotel metadata");
          }
        }

        // Add selected dates
        if (meta.selectedDates) {
          try {
            bookingData.selectedDates = JSON.parse(meta.selectedDates);
          } catch (e) {
            console.warn("[server] Could not parse selectedDates metadata");
          }
        }

        // Save booking to Firestore
        const docRef = await db.collection("bookings").add(bookingData);
        console.log(`[server] Booking saved to Firestore: ${docRef.id}`);

        // Create admin notifications
        try {
          const usersSnapshot = await db
            .collection("users")
            .where("isAdmin", "==", true)
            .get();

          const currencySymbol =
            meta.currency === "USD"
              ? "$"
              : meta.currency === "EUR"
                ? "\u20AC"
                : "\u20BE";
          const userIdentifier =
            meta.userEmail && meta.userEmail !== "undefined"
              ? meta.userEmail
              : `${meta.contactName} ${meta.contactSurname} (${meta.contactEmail})`;

          const selectedDatesStr = meta.selectedDates
            ? JSON.parse(meta.selectedDates).join(", ")
            : meta.startDate;

          for (const adminDoc of usersSnapshot.docs) {
            await db.collection("notifications").add({
              userId: adminDoc.id,
              title: "New Paid Booking",
              message: `${userIdentifier} paid and booked:\n"${meta.itemName}"\nDates: ${selectedDatesStr} (${meta.duration} days)\nPeople: ${meta.peopleCount}\nTotal: ${meta.totalPrice}${currencySymbol}\nEmail: ${meta.contactEmail}\nPhone: ${meta.contactPhone}`,
              type: "admin_booking_request",
              read: false,
              bookingId: docRef.id,
              createdAt: FieldValue.serverTimestamp(),
            });
          }
          console.log("[server] Admin notifications created");
        } catch (notifError) {
          console.error(
            "[server] Error creating admin notifications:",
            notifError
          );
        }

        // Create user notification
        try {
          const notifData = {
            title: "Booking Confirmed & Paid",
            message: `Your booking for "${meta.itemName}" (${meta.startDate}) has been paid successfully. Thank you!`,
            type: "booking_paid",
            read: false,
            bookingId: docRef.id,
            createdAt: FieldValue.serverTimestamp(),
          };

          if (meta.userId && meta.userId !== "" && meta.userId !== "undefined") {
            notifData.userId = meta.userId;
          } else {
            notifData.userId = null;
            notifData.guestEmail = meta.contactEmail;
          }

          await db.collection("notifications").add(notifData);
          console.log("[server] User notification created");
        } catch (userNotifError) {
          console.error(
            "[server] Error creating user notification:",
            userNotifError
          );
        }
      } catch (firestoreError) {
        console.error(
          "[server] Error saving booking to Firestore:",
          firestoreError
        );
      }
    }

    res.json({ received: true });
  }
);

// ============================================
// GET /session-status
// Verify payment status for success page
// ============================================
app.get("/session-status", async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "session_id is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    res.json({
      status: session.payment_status,
      customerEmail: session.customer_details?.email || session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error("[server] Error retrieving session:", error);
    res.status(500).json({
      error: "Failed to retrieve session",
      details: error.message,
    });
  }
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[server] GeorgiaTrips Payment Server running on port ${PORT}`);
  console.log(`[server] Health check: http://localhost:${PORT}/`);
  console.log(
    `[server] Checkout endpoint: POST http://localhost:${PORT}/create-checkout-session`
  );
  console.log(
    `[server] Webhook endpoint: POST http://localhost:${PORT}/webhook`
  );
  console.log(
    `[server] Session status: GET http://localhost:${PORT}/session-status`
  );
});
