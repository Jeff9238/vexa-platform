/**
 * BACKEND NOTIFICATION LOGIC
 * Deploy this to Firebase Cloud Functions to enable real-time alerts.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// 1. TRIGGER: Listing Price Update
// Detects when an Agent changes the price of a listing.
exports.onListingUpdate = functions.firestore
  .document("listings/{listingId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const listingId = context.params.listingId;

    // Check if Price Dropped
    if (newData.price < oldData.price) {
      const priceDiff = oldData.price - newData.price;
      console.log(`Price drop detected for ${listingId}: -${priceDiff}`);

      // Find all users who Favorited this item
      // Note: This requires a 'favorites' collection group query or storing 'favoritedBy' array on listing
      // For scalability, we query the top-level collectionGroup 'favorites'
      const favSnapshot = await db.collectionGroup("favorites")
        .where("listingId", "==", listingId)
        .get();

      const batch = db.batch();

      favSnapshot.forEach((doc) => {
        // The parent of a subcollection doc is the user document
        // path: users/{userId}/favorites/{favId}
        const userId = doc.ref.parent.parent.id;
        
        const notifRef = db.collection("users").doc(userId).collection("notifications").doc();
        batch.set(notifRef, {
            type: "price_drop",
            title: "Price Drop Alert!",
            message: `Good news! The price for "${newData.title}" has dropped by RM ${priceDiff.toLocaleString()}. New Price: RM ${Number(newData.price).toLocaleString()}.`,
            link: `/listing/${listingId}`,
            iconType: newData.type,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false
        });
      });

      await batch.commit();
      console.log(`Notified ${favSnapshot.size} users about price drop.`);
    }
  });

// 2. TRIGGER: New Listing Created
// Notifies users about new items (Simple Broadcaster for Demo)
exports.onNewListing = functions.firestore
  .document("listings/{listingId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    // In a real app, you would match this against "Saved Searches"
    // For this MVP, we will just log it or notify specific test users
    console.log("New Listing Created:", data.title);

    // Example: Notify a specific user (e.g., the admin or a demo user)
    // const testUserId = "user_jeff";
    // await db.collection("users").doc(testUserId).collection("notifications").add({
    //     type: "new_listing",
    //     title: `New ${data.type === 'property' ? 'Property' : 'Vehicle'}`,
    //     message: `Check out "${data.title}" in ${data.area}.`,
    //     link: `/listing/${context.params.listingId}`,
    //     iconType: data.type,
    //     createdAt: admin.firestore.FieldValue.serverTimestamp(),
    //     read: false
    // });
  });