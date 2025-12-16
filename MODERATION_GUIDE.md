# Content Moderation System - User Guide

## Overview

The Content Moderation System allows administrators and instructors to review and approve user-generated content (Reviews and Q&A) before they become visible to other users.

## Features

### ✨ Key Capabilities

- **Two Content Types**: Manage Reviews and Q&A separately
- **Three Filter Modes**: View Pending, Approved, or All content
- **Search Functionality**: Find specific content by keywords
- **Bulk Actions**: Approve or reject content with a single click
- **Real-time Updates**: Content updates immediately after actions
- **User Information**: See user avatars, names, and timestamps
- **Status Badges**: Visual indicators for approval status

## Accessing the Moderation Panel

1. Log in as an **Admin** or **Instructor**
2. Navigate to **Admin Dashboard** → **Courses** → **Moderation**
3. The moderation panel will load with pending reviews by default

## Interface Layout

### Navigation Tabs

- **Reviews Tab**: Manage course and instructor reviews
  - Shows star ratings (1-5)
  - Displays review comments
  - User information and timestamp
  
- **Q&A Tab**: Manage course questions and answers
  - Shows question title and description
  - Associated course/lesson information
  - User information and timestamp

### Filter Options

| Filter | Description |
|--------|-------------|
| **Pending** | Shows only unapproved content awaiting review |
| **Approved** | Shows only approved and published content |
| **All** | Shows all content regardless of status |

### Search Bar

- Type keywords to search through content
- Searches in:
  - Review comments (Reviews tab)
  - Question text and descriptions (Q&A tab)

## How to Use

### Approving Content

1. Navigate to the appropriate tab (Reviews or Q&A)
2. Select "Pending" filter to see unapproved content
3. Read through the content to verify it meets guidelines
4. Click the **"Approve"** button (green button with checkmark icon)
5. Content will immediately become visible to all users
6. A success toast notification will appear

### Rejecting Content

1. Navigate to the appropriate tab
2. Select "Pending" filter for new content, or "Approved" to unapprove existing content
3. Review the content
4. Click the **"Reject"** or **"Unapprove"** button (red button with X icon)
5. Content will be hidden from public view
6. A success toast notification will appear

### Managing Approved Content

- Approved content can be **unapproved** at any time
- Navigate to "Approved" filter
- Click **"Unapprove"** to hide content from users
- This is useful if content becomes inappropriate or outdated

## Content Information

### For Reviews

Each review card displays:
- **User Avatar**: Profile picture or initials
- **User Name**: Full name or email
- **Star Rating**: Visual 1-5 star rating
- **Comment**: Full review text
- **Timestamp**: When the review was created
- **Status Badge**: "Pending" (yellow) or "Approved" (green)

### For Q&A

Each Q&A card displays:
- **User Avatar**: Profile picture or initials
- **User Name**: Full name or email
- **Question Title**: Main question text
- **Description**: Additional details (if provided)
- **Timestamp**: When the question was asked
- **Status Badge**: "Pending" (yellow) or "Approved" (green)

## Best Practices

### Content Review Guidelines

1. **Check for Spam**: Reject promotional or irrelevant content
2. **Verify Appropriateness**: Ensure content is respectful and professional
3. **Quality Control**: Approve helpful, constructive feedback
4. **Timeliness**: Review pending content regularly (daily recommended)

### What to Approve ✅

- Constructive feedback
- Genuine questions
- Helpful reviews
- Professional language
- Course-related content

### What to Reject ❌

- Spam or promotional content
- Offensive or abusive language
- Irrelevant questions
- Duplicate content
- Personal attacks

## User Experience Flow

### For Students (Regular Users)

1. **Post Content**: Students submit reviews or ask questions
2. **Default Status**: Content is set to "unapproved" automatically
3. **Hidden from View**: Content is NOT visible to anyone (including the author) until approved
4. **After Approval**: Content becomes visible to all users
5. **If Rejected**: Content remains hidden

### For Admins/Instructors

1. **Full Visibility**: Can see all content regardless of approval status
2. **Moderation Power**: Can approve or reject any content
3. **Flexible Actions**: Can unapprove previously approved content

## Technical Details

### API Endpoints

#### Reviews
- `GET /api/reviews` - Get all reviews (with `approved` filter)
- `PUT /api/reviews/admin/:id/approve` - Approve a review
- `PUT /api/reviews/admin/:id/reject` - Reject/unapprove a review

#### Q&A
- `GET /api/qna` - Get all Q&As (with `approved` filter)
- `PUT /api/qna/admin/:id/approve` - Approve a Q&A
- `PUT /api/qna/admin/:id/reject` - Reject/unapprove a Q&A

### Database Schema

Both Review and QnA models include:
```typescript
{
  approved: {
    type: Boolean,
    default: false,
    required: true
  }
}
```

### Query Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search keyword
- `approved`: Filter by approval status (true/false)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort direction (default: desc)

## Troubleshooting

### Content Not Appearing

**Issue**: Can't see new content  
**Solution**: Check if "Pending" filter is selected

### Actions Not Working

**Issue**: Approve/Reject buttons not working  
**Solution**: 
- Check your admin permissions
- Refresh the page
- Check browser console for errors

### Search Not Finding Results

**Issue**: Search returns no results  
**Solution**:
- Try different keywords
- Clear search and check if content exists
- Verify you're on the correct tab (Reviews vs Q&A)

## Migration Notes

### For Existing Databases

If you have existing reviews and Q&As in your database before implementing this system:

**Run this migration to set default values:**

```javascript
// In MongoDB
db.reviews.updateMany({}, { $set: { approved: false } })
db.qnas.updateMany({}, { $set: { approved: false } })
```

**Or to approve all existing content:**

```javascript
// In MongoDB
db.reviews.updateMany({}, { $set: { approved: true } })
db.qnas.updateMany({}, { $set: { approved: true } })
```

## Future Enhancements (Potential)

- [ ] Bulk approve/reject multiple items
- [ ] Notification system for content authors
- [ ] Moderation queue with priority levels
- [ ] Automated spam detection
- [ ] Content flagging by users
- [ ] Moderation activity logs
- [ ] Email notifications for pending content
- [ ] Custom rejection reasons with feedback

## Support

For technical issues or questions:
1. Check this documentation first
2. Review the browser console for errors
3. Verify database migration was completed
4. Check API response in Network tab
5. Contact development team if issue persists

---

**Last Updated**: December 16, 2025  
**Version**: 1.0.0

