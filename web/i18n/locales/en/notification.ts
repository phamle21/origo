export default {
  title: 'Notifications',
  open: 'Notifications',
  openUnread: 'Notifications, nothing new | Notifications, 1 unread | Notifications, {count} unread',
  markAllRead: 'Mark all as read',
  empty: 'No notifications yet. When someone tags you, adds you to a project or gives you a schedule entry, it shows up here.',
  unread: 'Unread',
  kinds: {
    mention: '{actor} mentioned you in a comment on {screen} · point {number}',
    memberAdded: '{actor} added you to the project as {role}',
    roleChanged: '{actor} changed your role to {role}',
    taskAssigned: '{actor} made you owner of {stage} of “{item}” ({start} → {end})',
  },
};
