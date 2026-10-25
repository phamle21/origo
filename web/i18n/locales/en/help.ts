export default {
  title: 'User guide',
  description: 'Each lesson has a few short steps with real screenshots. The orange numbers point at exactly what to click. New here? Start with lesson 1.',
  stepCount: '{count} steps',
  lessonNumber: 'Lesson {number}',
  stepNumber: 'Step {number}',
  tip: 'Tip',
  topicsLabel: 'Guide lessons',
  previous: 'Previous lesson',
  next: 'Next lesson',
  backToList: 'All lessons',
  imageAlt: 'Picture: {title}',
  zoom: 'Click the picture to see it full screen (click again or press Esc to leave)',
  audience: {
    editors: 'For people who can edit',
    admins: 'For administrators',
  },
  topics: {
    start: {
      title: 'Getting started',
      summary: 'Sign in and find your way around Origo.',
      steps: {
        login: {
          title: 'Sign in',
          text: 'Type your email in box 1. Type your password in box 2. Press button 3 to go in.',
          tip: 'Forgot your password? Ask an administrator to reset it for you.',
        },
        home: {
          title: 'Pick a big tile',
          text: 'Once inside you see big tiles. Each tile is an area. Click Projects (1) to work on projects. Click Guide (2) to read this page again.',
        },
        launcher: {
          title: 'The nine-dot button',
          text: 'At the top left there is a nine-dot button (1). Click it and the tiles (2) show again, on any page.',
        },
        bell: {
          title: 'The bell',
          text: 'The bell (1) shows a red number when there is news: someone tagged you, added you to a project, changed your role or gave you a schedule entry. Click it for the list (2), then click a line to open the place.',
        },
      },
    },
    projects: {
      title: 'Projects',
      summary: 'Find your projects, open each part and edit project details.',
      steps: {
        list: {
          title: 'Find your project',
          text: 'The Projects page has one card per project you belong to. The name is at 1. Number 2 shows the manager, members and screens. In the bar on top, type to search, pick Active or Archived, and switch between grid and list.',
          tip: 'Your browser remembers whether you like the grid or the list.',
        },
        open: {
          title: 'Open a part of the project',
          text: 'Each card has buttons at 1: Plan, Design, Members. Click one to open that part.',
        },
        tabs: {
          title: 'Switch between parts',
          text: 'Inside a project, the row of buttons at 1 switches between Plan, Design, Members and Details.',
        },
        info: {
          title: 'Edit the name and description',
          text: 'Click Details (1). Change the name or description (2) and press Save. The project code cannot change.',
          tip: 'Only the project manager or an administrator can edit. Everyone else can read.',
        },
        archive: {
          title: 'Archive or delete a project',
          text: 'On the Details page, in the Danger zone (1): Archive makes the project read-only; Delete for good removes it. You must type the exact project code before the button works.',
          tip: 'An archive can be brought back. Deleting for good cannot be undone, and only administrators can do it.',
        },
      },
    },
    'plan-read': {
      title: 'Reading the plan',
      summary: 'Understand the chart: rows, coloured bars, today and what is done.',
      steps: {
        summary: {
          title: 'Progress overview',
          text: 'The overview sits on top. 1: work done (in man-days, or in tasks while no effort is entered). 2: time passed, in working days. Click the overview line to open the table per stage (3): window, owner, planned, done and left.',
          tip: 'When time passed runs well ahead of work done, Origo shows “Behind schedule”. A stage past its end with unfinished tasks is marked “Late”.',
        },
        export: {
          title: 'Export to Excel',
          text: 'Click “Export Excel” (1) to download a workbook with three sheets: Gantt Chart (per stage: effort, start, end, owner, status, %, link, note, plus a day-by-day chart), Weekly Report (hours, weekly progress, summaries) and .setting (statuses, members, holidays).',
          tip: 'The file uses the content language you have chosen; missing translations fall back to Vietnamese.',
        },
        rows: {
          title: 'Each row is a piece of work',
          text: 'The work is named on the left (1). On the right are coloured bars (2), from the start day to the end day. The red line (3) is today.',
        },
        legend: {
          title: 'Each colour is a stage',
          text: 'For example purple is basic design and dark green is development. The colour key at 1 tells which colour is which stage.',
        },
        done: {
          title: 'Green means done',
          text: 'When everything in a row is done, the whole row turns green with a ✓ (1). You can see at a glance what is finished.',
        },
        toolbar: {
          title: 'The toolbar',
          text: '1: switch between Chart and Table. 2: zoom in or out. 3: jump to today. 4: show it full screen.',
          tip: 'Full screen is handy when presenting to the team. Press Esc to leave it.',
        },
        filter: {
          title: 'Filter to find things',
          text: 'Type a name in the search box (1), pick an owner (2) or click a status (3) to show only what you need. Pick “Mine” to see your own work. Filters work in both Chart and Table; press “Clear filters” to see everything again.',
        },
        details: {
          title: 'See the details of one piece of work',
          text: 'Click the name of a row. The details open on the right: the name (1) and the dates of each stage (2). Click a coloured bar (or a date cell in the Table) to see just that stage, ready to edit; press “See the whole item” to see everything again.',
        },
      },
    },
    'plan-edit': {
      title: 'Changing the plan',
      summary: 'Drag bars to change dates, change status, reorder rows and add notes.',
      steps: {
        effort: {
          title: 'Record effort, % and documents',
          text: 'When editing a stage’s schedule, pick the project’s own status (1), the planned man-days (2), the share done (3) and a link or document name (4). There is a note box too. The overview’s progress comes from these figures.',
          tip: 'A task in a “done” status always counts as 100%; no need to enter a percentage.',
        },
        statuses: {
          title: 'Name your own statuses',
          text: 'Click the gear and open the “Statuses” tab (1). Each status belongs to a group (2) — to do, in progress or done — which sets the bar colour and how progress is counted. “Add status” (3) adds one, e.g. “Checking” or “Waiting”.',
        },
        move: {
          title: 'Move a whole bar',
          text: 'Press and hold the middle of a bar, then drag it left or right. Let go and it is saved.',
          tip: 'Only the project manager and the BA can change the plan. Everyone else can read it.',
        },
        resize: {
          title: 'Change the start or end day',
          text: 'Drag the ‖ grip at the start of the bar (1) to change the start day. Drag the grip at the end (2) to change the end day.',
        },
        status: {
          title: 'Change the status quickly',
          text: 'Right-click a bar. Choose To do (1), In progress or Done (2). To take the stage off the schedule, click the red line (3); you are asked first.',
        },
        reorder: {
          title: 'Reorder rows',
          text: 'Press and hold the ⋮⋮ grip at the start of a row and drag it up or down. The dashed box (1) shows where it will land.',
        },
        'row-menu': {
          title: 'Right-click a row',
          text: 'Right-click the name of a row to open a menu (1): open details, add a note, add work under it, move it up or down, or delete it.',
        },
        note: {
          title: 'Notes',
          text: 'The ⓘ button (1) is a note. Hover it to read it quickly. Click it to read it all or edit it.',
        },
        stages: {
          title: 'Edit the stages',
          text: 'Click the gear on the toolbar, “Stages” tab. Drag ⋮⋮ (1) to reorder, rename (2), click the colour (3) to pick another one. You can also set the window and owner of the whole stage (4). Then press Save.',
        },
        table: {
          title: 'Table view',
          text: 'The table works like the chart. Right-click a date cell (1) to open the status menu (2).',
        },
      },
    },
    design: {
      title: 'Screen design',
      summary: 'Look at each screen, read what every number means, comment with tags and delete screens.',
      steps: {
        list: {
          title: 'The screen list',
          text: 'Open Design. Each card is a screen, such as SC-01. Click a card (1) to open it.',
        },
        pins: {
          title: 'The numbers on the picture',
          text: 'The picture has numbered dots (1, 2). Each dot points at a place on the screen. Click a dot to read what that place does.',
        },
        tabs: {
          title: 'Read about one dot',
          text: 'On the right are tabs (1): basic design, detailed design, tests and comments. Click each tab to read it.',
        },
        comment: {
          title: 'Comment and tag people',
          text: "Open the Comments tab and write in box 1. Type {'@'} and a few letters of a name to list the people in the project (2); pick one to tag them. Press Send.",
          tip: 'Tagged people see it under the bell.',
        },
        delete: {
          title: 'Delete a screen',
          text: 'Click the red bin (1) on a screen card. You are asked first and told how many points and comments go with it.',
          tip: 'A deleted screen cannot be brought back. Only people who can edit the design see this button.',
        },
      },
    },
    members: {
      title: 'Members',
      summary: 'Add people to a project, change their role or remove them.',
      steps: {
        add: {
          title: 'Add someone to the project',
          text: 'Press “Add a member” at the top. In the box that opens, type a name or email to pick the person (1), click a role (2) and press Add.',
          tip: 'Only the project manager can add or remove people.',
        },
        role: {
          title: 'Change a role or remove someone',
          text: 'In the list, pick a new role in box 1. Press the bin (2) to take the person out of the project; you are asked first and told how many schedule entries they own.',
        },
      },
    },
    languages: {
      title: 'Writing in several languages',
      summary: 'Write Vietnamese first, then add or translate other languages.',
      steps: {
        field: {
          title: 'Boxes with a globe button',
          text: 'The main box is always Vietnamese. The 🌐 button next to it (1) opens the other languages. A number like 1/2 means 1 of 2 other languages is filled in.',
        },
        dialog: {
          title: 'Type or let the machine translate',
          text: 'Click 🌐 to open the box. Press “Translate empty boxes” (1) to let the machine help. Read it, fix it if needed, then press Done (2).',
          tip: 'The free machine translation can be wrong. Do not translate secret information.',
        },
      },
    },
    profile: {
      title: 'Profile and appearance',
      summary: 'Change light or dark mode, language, your name and password.',
      steps: {
        menu: {
          title: 'Your menu',
          text: 'Click your name at the top right. Choose light or dark (1), change the language (2), or open your profile (3).',
        },
        page: {
          title: 'The profile page',
          text: 'On the profile page, change your name (1) or your password (2), then press Save.',
        },
      },
    },
    weekly: {
      title: 'Weekly report',
      summary: 'Freeze progress every week, write the summary and enter hours.',
      steps: {
        progress: {
          title: 'Progress by week',
          text: 'Open the project’s “Weekly report” tab. Each row (1) is a week: overall progress, the change from the week before, time passed and each stage’s progress when it was recorded. “Record this week now” (2) saves the figures right away.',
          tip: 'Every Monday morning Origo records the week before by itself. A recorded week stays as it was, whatever changes later.',
        },
        week: {
          title: 'Summary and hours',
          text: 'Pick a week (1), write its summary (2): results, changes in people, requirements and quality. Enter the hours each member worked on the project (3), then Save.',
          tip: 'Use 🌐 next to the summary to add a Japanese version or translate it automatically.',
        },
      },
    },
    admin: {
      title: 'Administration',
      summary: 'Create users, share out rights and choose languages for the whole system.',
      steps: {
        'excel-template': {
          title: 'Your team’s Excel template',
          text: 'Settings → Excel template. Upload the project-management file your team uses (2) and click “Upload and use” (3). Origo keeps only its layout, formulas, colours and drop-downs; the file’s old data is removed before it is stored. Box 1 shows the template in use and the Gantt sheet chosen.',
          tip: 'From then on, “Export Excel” on a plan fills exactly the cells people type into; formulas recalculate when the file is opened in Excel or Google Sheets.',
        },
        calendar: {
          title: 'Working calendar',
          text: 'Settings → Working calendar. Each row is a date (1) and its kind (2): a holiday, or a make-up working day (a weekend day that is worked). The list is grouped by year (3).',
          tip: 'Every “working days” figure in plans, weekly reports and the Excel file uses this calendar.',
        },
        users: {
          title: 'Users',
          text: 'Open Settings → Users. Press “New account” (1) to create a user. Press “Manage” (2) to edit, lock or add them to projects.',
        },
        roles: {
          title: 'System roles',
          text: 'Each role is a set of rights. Tick a box (1) to give the role that right.',
        },
        'project-roles': {
          title: 'Roles in a project',
          text: 'Open Settings → Project access → Roles. Press “New role” (1) to create one, such as Tech lead. Press “Edit” (2) to rename it or tick permissions. Project members are given one of these roles.',
        },
        permissions: {
          title: 'Permissions',
          text: 'The Permissions pages (under System access and Project access) list every permission by group (1). Press “Edit” (2) to change its name, description, group or order.',
          tip: 'Permissions cannot be added or removed, because each one belongs to a real feature. Roles you can create freely.',
        },
        languages: {
          title: 'Languages',
          text: 'Pick a language (1), press Add (2), then Save. From then on every box with a 🌐 button has that language too.',
        },
      },
    },
  },
  stepsLabel: 'Steps of this lesson',
};
