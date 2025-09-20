# Quiet Hours Scheduler  

**A React + Supabase web application to help users manage quiet hours schedules.**  

Users can create, edit, and track schedules, receive email notifications, and see real-time activity logs.  

## Features  

- Create and manage quiet hours schedules  
- Track schedules by day and time  
- Real-time "Currently Active" indicator  
- Edit/Delete schedules easily  
- Activity log with timestamps  
- Email notifications for scheduled quiet hours  
- Responsive design for desktop and mobile  

## Tech Stack  

- **Frontend:** React, Next.js  
- **Backend:** Supabase (Auth, RLS, Edge Functions), MongoDB  
- **Deployment:** Vercel  

## How It Works  

1. Users sign up and log in with email authentication.  
2. Users can create “quiet hours” blocks for study or focus time.  
3. The system sends an email notification **10 minutes before a block starts**.  
4. All schedule data and activity logs are stored in MongoDB.  
5. Real-time updates show which schedules are currently active.  

## Live Demo  

[Check the live app here](https://quiet-hours-scheduler-omega.vercel.app/)  

## GitHub Repository  

[View the code with commit history](https://github.com/bhavishk20/quiet-hours-scheduler)  
  

## Notes  

- All features have been tested and are fully functional.  
- The app is responsive and works on both desktop and mobile browsers.
