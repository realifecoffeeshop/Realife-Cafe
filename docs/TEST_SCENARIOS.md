# Development Test Scenarios

This document outlines the critical workflows for the Realife Cafe application and provides step-by-step instructions for testing them during development.

---

## Scenario 1: User Authentication & Loyalty Accrual

**Objective:** Verify that a user can register/login, place an order, and see their loyalty points accrue correctly.

### Prerequisites:
- Use a fresh browser tab or clear site data to ensure no existing sessions.
- Access to the Dev environment.

### Steps:
1.  **Registration / Login:**
    - Navigate to the **Profile** tab.
    - If logged out, click "Sign in with Google" (or the provided login method).
    - If this is a new account, verify the profile shows **0 points**.
2.  **Order Process:**
    - Switch to the **Menu** tab.
    - Add at least **2 drinks** to the cart.
    - Navigate to the **Cart** and proceed to checkout.
    - Select **"Pay with Card"** or **"Pay with Cash"** (Loyalty only accrues on standard payment methods).
    - Complete the checkout process and verify the order appears in the **Orders** tab (or is processed by the KDS).
3.  **KDS Fulfillment (Administrative):**
    - Open the **Kitchen Display (KDS)** view.
    - Locate the new order.
    - Click **"Complete Order"** on the ticket.
4.  **Verification:**
    - Switch back to the **Profile** tab.
    - Refresh if necessary (points sync automatically).
    - **Expected Result:** Points should have increased by the number of drinks purchased (e.g., if 2 drinks were bought, points should now be **2**).
5.  **Cycle Check (Optional):**
    - Repeat the process until points reach **14**.
    - Place one more drink order and complete it via KDS.
    - **Expected Result:** The points should reset to **0** (signifying a reward was earned/applied).

---

## Scenario 2: KDS Ticket Management (Grouping & Ungrouping)

**Objective:** Verify that multiple orders can be grouped into a single visual ticket and then ungrouped back to individual tickets.

### Prerequisites:
- At least 3-4 active orders in the **Pending** queue of the KDS.

### Steps:
1.  **Grouping (Visual):**
    - Navigate to the **Kitchen Display (KDS)**.
    - Ensure you are in the **"Pending"** tab and "Order" view mode.
    - Click the **"Group Tickets"** button to enter grouping mode.
    - Select **2 or 3 orders** by clicking their tickets. Verify they highlight with a blue border and checkmark.
    - Click **"Group Visual"**.
    - **Expected Result:** The individual tickets should disappear and be replaced by a single, larger ticket containing all items, labeled as a "Combined Group Ticket".
2.  **Verification of Grouped Actions:**
    - Click a single item within the combined ticket to mark it as complete.
    - Verify it updates correctly across the combined view.
3.  **Ungrouping (Group Level):**
    - On the "Combined Group Ticket", locate and click the **"Ungroup"** icon/button (usually at the top right of the ticket).
    - **Expected Result:** The combined ticket should vanish, and the original individual tickets should reappear in the queue in their original state.
4.  **Ungrouping (Single Ticket Level):**
    - Group two tickets again.
    - Instead of clicking the group ungroup button, click the ungroup button on an individual section (or use the selection toggle if supported).
    - *Note:* The "Ungroup Group" button handles the entire batch.
5.  **Verification:**
    - Ensure all items and statuses were preserved during the transition.

---

## Scenario 3: Loyalty Persistence (Logout/Login)

**Objective:** Verify that loyalty points are persisted across sessions.

### Steps:
1.  Verify the current user has **X points**.
2.  Go to the **Profile** tab and click **"Log Out"**.
3.  Refresh the page.
4.  Click **"Sign in with Google"** using the **same account**.
5.  **Expected Result:** The user profile should still show **X points**.

---
