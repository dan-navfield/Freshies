# Complete Approval Workflow

## Overview
When a parent approves or declines a product, the system now performs a complete workflow including product library management, routine integration, notifications, and history tracking.

---

## Approval Flow

### When a Product is APPROVED:

1. **Update Approval Status**
   - Status changes from `pending` → `approved`
   - `reviewed_at` timestamp is set
   - `reviewed_by` is set to parent's user ID
   - Parent notes are saved

2. **Add to Child's Product Library**
   - Creates entry in `child_products` table
   - Product becomes part of child's approved collection
   - Links back to original approval via `approval_id`
   - Status set to `active`

3. **Add to Routine (Optional)**
   - If parent checked "Add to routine"
   - Product is added to child's morning routine by default
   - Creates entry in `routine_products` table
   - Sets appropriate `step_order`

4. **Send Notification to Child**
   - Creates notification in `notifications` table
   - Type: `approval`
   - Title: "✅ [Product Name] Approved!"
   - Message includes parent notes if provided
   - Action button to view product

5. **Create History Record**
   - Logs approval in `approval_history` table
   - Records who approved and when
   - Stores parent notes
   - Available for audit trail

---

## Decline Flow

### When a Product is DECLINED:

1. **Update Approval Status**
   - Status changes from `pending` → `declined`
   - `reviewed_at` timestamp is set
   - `reviewed_by` is set to parent's user ID
   - Parent notes are saved (reason for decline)

2. **Send Notification to Child**
   - Creates notification in `notifications` table
   - Type: `approval`
   - Title: "❌ [Product Name] Not Approved"
   - Message includes parent's reason if provided
   - Action button to view details

3. **Create History Record**
   - Logs decline in `approval_history` table
   - Records who declined and when
   - Stores reason/notes
   - Available for review

---

## Database Tables Created

### 1. `child_products`
Stores approved products for each child.

**Key Fields:**
- `child_id` - Links to child
- `approval_id` - Links to original approval
- `product_name`, `product_brand`, `product_image_url`
- `status` - active, discontinued, removed
- `usage_count` - How many times used
- `last_used_at` - Last usage timestamp

### 2. `child_routines`
Stores morning/evening/custom routines for each child.

**Key Fields:**
- `child_id` - Links to child
- `name` - Routine name
- `routine_type` - morning, evening, custom
- `reminder_time` - When to remind
- `enabled` - Active/inactive

### 3. `routine_products`
Links products to routines with order.

**Key Fields:**
- `routine_id` - Links to routine
- `product_id` - Links to child_product
- `step_order` - Order in routine
- `instructions` - Usage instructions

### 4. `notifications`
In-app notifications for users.

**Key Fields:**
- `user_id` - Recipient
- `type` - approval, routine, product, system
- `title`, `message`
- `read` - Read status
- `action_url` - Where to navigate

### 5. `product_usage_log`
Tracks when products are used.

**Key Fields:**
- `child_id`, `product_id`
- `used_at` - Usage timestamp
- `routine_id` - If used in routine
- `reaction` - good, neutral, bad

---

## Services Created

### `productsService.ts`
- `addChildProduct()` - Add to library
- `getChildProducts()` - Get all products
- `logProductUsage()` - Track usage
- `removeChildProduct()` - Remove from library

### `routinesService.ts`
- `getChildRoutines()` - Get all routines
- `addProductToRoutine()` - Add product
- `removeProductFromRoutine()` - Remove product
- `createRoutine()` - Create custom routine
- `updateRoutine()` - Update routine settings

### `notificationsService.ts`
- `createNotification()` - Create notification
- `getNotifications()` - Get user notifications
- `markNotificationAsRead()` - Mark as read
- `sendApprovalNotification()` - Helper for approvals
- `sendRoutineReminder()` - Helper for routines

---

## Next Steps

### To Test:
1. Run `SETUP_CHILD_PRODUCTS.sql` in Supabase
2. Approve a product in the app
3. Check that:
   - Product appears in child's library
   - Notification is created
   - History record exists
   - If "Add to routine" was checked, product is in routine

### Future Enhancements:
- Push notifications (currently in-app only)
- Email notifications to parents
- Product expiry tracking
- Routine completion tracking
- Usage analytics dashboard
- Product recommendations based on usage
