# AI-Powered Dental Scheduler: MVP Sprint Plan

This document outlines the development tasks for the Minimum Viable Product (MVP). The initial project scaffolding, server setup, and basic configurations have been completed. This plan focuses on implementing the core application features as detailed in the PRD.

---

## Topic: Authentication & User Management 🔒

[cite_start]**Epic:** Secure User Access & Profile Management[cite: 23].
This epic covers the **frontend UI implementation** for the secure authentication flows. The backend services and API endpoints appear to be largely in place, so these tasks will focus on building the client-side components to interact with them. [cite_start]The strategic choice to use a custom authentication provider is to accelerate development and ensure robust security for the MVP[cite: 39, 40].

### 1. [ ] Story: Implement Receptionist Sign-Up UI

[cite_start]As a new dental clinic receptionist, I want to see and use a clear sign-up form so that I can create an account to access the scheduling system[cite: 25].

- [ ] `Task:` Create a new route and page component for sign-up at `/signup`.
- [ ] `Task:` Develop a reusable `Input` component with label, placeholder, and error message states using Tailwind CSS.
- [ ] `Task:` Develop a reusable `Button` component with loading and disabled states using Tailwind CSS.
- [ ] [cite_start]`Task:` Build the sign-up form UI using the `Input` and `Button` components, including fields for First Name, Last Name, Email, and Mobile Number[cite: 26].
- [ ] `Task:` Implement client-side form state management (e.g., using `useState`).
- [ ] `Task:` Create a service function to call the backend's `/api/v1/public/auth/save-business-profile` endpoint.
- [ ] `Task:` Implement form submission logic, calling the sign-up service function and handling the API response.
- [ ] [cite_start]`Task:` Implement error handling to display validation messages from the API next to the corresponding form fields[cite: 29].
- [ ] `Task:` On successful sign-up, redirect the user to the OTP verification page.

### 2. [ ] Story: Implement OTP Verification UI

As a user who has just signed up, I want to be able to enter the OTP I received so that I can verify my account.

- [ ] `Task:` Create a new route and page component for OTP verification at `/verify-otp`.
- [ ] `Task:` Build the OTP verification form UI, including an input for the 6-digit OTP and a "Verify" button.
- [ ] [cite_start]`Task:` Implement a countdown timer to show when a new OTP can be requested[cite: 25].
- [ ] `Task:` Create a service function to call the backend's `/api/v1/public/auth/verify-otp` endpoint, sending the OTP and the temporary token from the sign-up step.
- [ ] `Task:` On successful verification, display a success message and a button to proceed to the login page.
- [ ] `Task:` Implement a "Resend OTP" button that becomes active after the countdown.
- [ ] `Task:` Create a service function for the "Resend OTP" button to call the `/api/v1/public/sign-up/send-mobile-otp` endpoint.
- [ ] `Task:` Display appropriate feedback for successful or failed OTP resend attempts.

### 3. [ ] Story: Implement Receptionist Login UI

[cite_start]As a registered receptionist, I want a secure login form so that I can access the appointment management system[cite: 30].

- [ ] `Task:` Create a new route and page component for login at `/login`.
- [ ] [cite_start]`Task:` Build the login form UI using the reusable `Input` and `Button` components for email and password[cite: 31].
- [ ] `Task:` Implement client-side state management for the login form.
- [ ] `Task:` Create a service function to call the backend's `/api/v1/public/auth/business-user/sign-in` endpoint.
- [ ] `Task:` Implement logic to securely store the `access_token` and `refresh_token` upon successful login (e.g., in httpOnly cookies or secure local storage).
- [ ] `Task:` Handle the API response for both successful login and "password change required" scenarios.
- [ ] `Task:` On successful login, redirect the user to the main dashboard.
- [ ] `Task:` If the API indicates a password change is required, redirect the user to the `/reset-password` page.
- [ ] [cite_start]`Task:` Implement clear error handling for invalid credentials or other login failures[cite: 34].
- [ ] `Task:` Add a "Forgot Password?" link to the login form.

### 4. [ ] Story: Implement Password Reset UI

[cite_start]As a receptionist who forgot my password, I want to be able to securely reset it so that I can regain access to my account[cite: 37].

- [ ] `Task:` Create a new route and page component for password reset at `/reset-password`.
- [ ] `Task:` Build the UI for the password reset flow, which will handle both the initial password change (after OTP verification) and the "forgot password" flow.
- [ ] [cite_start]`Task:` The form should include fields for "Email", "Temporary/Old Password", and "New Password"[cite: 38, 39].
- [ ] `Task:` Create a service function to call the `/api/v1/public/auth/first-time/change-password` endpoint.
- [ ] `Task:` On successful password reset, display a confirmation message and redirect the user to the login page.
- [ ] `Task:` Implement robust error handling for incorrect temporary passwords or other failures.

### 5. [ ] Story: Implement Basic User Profile UI

As a logged-in receptionist, I want to view and update my basic profile information so that my account details are accurate.

- [ ] `Task:` Create a new authenticated route and page component at `/profile`.
- [ ] [cite_start]`Task:` Design and implement a basic UI to display the user's name and email[cite: 35].
- [ ] `Task:` Include an "Edit" mode that allows the user to update their `firstName` and `lastName`.
- [ ] `Task:` Create a service function to call the private `/api/v1/private/auth/me` endpoint to fetch user data, and another service to handle profile updates.
- [ ] `Task:` Ensure the profile page is protected and accessible only to authenticated users.

---

## Topic: Intelligent Scheduling (Rule-Based Slot Management) 📅

[cite_start]**Epic:** Efficient Appointment Booking & Conflict Prevention[cite: 43].
This epic is the core of the MVP. It focuses on building the functionality that allows receptionists to book appointments efficiently while preventing conflicts. [cite_start]For the MVP, the "intelligence" is rule-based, directly addressing the market pain points of managing high emergency loads and administrative inefficiencies[cite: 44, 45, 61].

### 6. [ ] Story: Create Core Data Models

As a backend developer, I need to define and create the Mongoose schemas for Dentists, Appointments, and Patients so that scheduling data can be stored and managed.

- [ ] `Task:` Create a `dentist.model.ts` file with a schema including `name`, `specialty`, and `workingHours` (e.g., an array of objects with day and time ranges).
- [ ] `Task:` Create a `patient.model.ts` file with a schema for basic patient info: `name`, `contactNumber`, and `criticalNotes`.
- [ ] `Task:` Create an `appointment.model.ts` file with a schema including `patient` (ObjectId ref), `dentist` (ObjectId ref), `procedureName`, `startTime`, `endTime`, and `status` (e.g., 'Scheduled', 'Completed', 'Cancelled').
- [ ] [cite_start]`Task:` Create a `procedure.model.ts` file with a schema for `name` and `defaultDuration` in minutes[cite: 54].

### 7. [ ] Story: Implement a Simple Patient Management API

As a backend developer, I need API endpoints to add and search for patients so the frontend can manage patient records for appointments.

- [ ] `Task:` Create a new `patient.controller.ts` and `patient.service.ts`.
- [ ] `Task:` Implement a private API endpoint `POST /api/v1/private/patients` to create a new patient.
- [ ] `Task:` Implement a private API endpoint `GET /api/v1/private/patients/search?q=` to search for patients by name or contact number.
- [ ] `Task:` Implement a private API endpoint `GET /api/v1/private/patients/:id` to fetch a single patient's details, including their critical notes.

### 8. [ ] Story: Implement Appointment Booking & Availability API

As a backend developer, I need to create the API endpoints for creating appointments and checking for available slots.

- [ ] `Task:` Create a new `appointment.controller.ts` and `appointment.service.ts`.
- [ ] `Task:` Create a private API endpoint `GET /api/v1/private/availability` that accepts `dentistId` and `date` as query parameters.
- [ ] `Task:` Implement the backend logic for the availability endpoint. [cite_start]This should fetch the dentist's working hours and all existing appointments for that day, then return a list of available time slots[cite: 51].
- [ ] `Task:` Create a private API endpoint `POST /api/v1/private/appointments` to create a new appointment.
- [ ] [cite_start]`Task:` This endpoint's logic must perform a final conflict check before saving the appointment to prevent double bookings[cite: 57, 58].
- [ ] [cite_start]`Task:` The creation logic should automatically set the `endTime` based on the procedure's default duration[cite: 54].

### 9. [ ] Story: Implement Calendar View API

As a backend developer, I need an API endpoint to fetch appointments for a given date range so they can be displayed on the dashboard calendar.

- [ ] `Task:` Create a private API endpoint `GET /api/v1/private/appointments` that accepts `startDate` and `endDate` as query parameters.
- [ ] [cite_start]`Task:` The endpoint should return a list of all appointments within the specified date range, populating patient and dentist details[cite: 60].
- [ ] `Task:` Add filtering capabilities to the endpoint, allowing appointments to be fetched for a specific dentist (e.g., `?dentistId=...`).

### 10. [ ] Story: Build the Main Dashboard and Calendar View UI

[cite_start]As a frontend developer, I want to build the main dashboard that provides a daily/weekly overview of appointments so that receptionists can manage the clinic's schedule at a glance[cite: 59].

- [ ] `Task:` Create the main dashboard page, accessible after login. This should be the root authenticated route (`/`).
- [ ] `Task:` Fetch data from the `GET /api/v1/private/appointments` endpoint to display on the calendar.
- [ ] [cite_start]`Task:` Integrate a simple calendar component (or build one) to display the appointments for the selected day or week[cite: 60].
- [ ] [cite_start]`Task:` Each calendar event should display key details like patient name and time[cite: 60]. Clicking an event should show more details.
- [ ] [cite_start]`Task:` Implement controls to navigate between days and weeks on the calendar[cite: 61].
- [ ] [cite_start]`Task:` Add a prominent "Book New Appointment" button that opens the booking modal/form[cite: 100].

### 11. [ ] Story: Implement the "Book New Appointment" Form UI

As a frontend developer, I want to build the "Book New Appointment" form so that receptionists can schedule patients.

- [ ] [cite_start]`Task:` Create a modal or a separate page for the "Book New Appointment" form[cite: 47].
- [ ] [cite_start]`Task:` Add form fields for Patient, Dentist, Procedure, and Date/Time[cite: 48].
- [ ] `Task:` For the "Patient" field, implement an autocomplete search that uses the `GET /api/v1/private/patients/search` endpoint. Also, include a button to add a new patient, which can open another small form.
- [ ] [cite_start]`Task:` When a date and dentist are selected, call the `GET /api/v1/private/availability` endpoint and display the available slots for the receptionist to choose from[cite: 51].
- [ ] [cite_start]`Task:` When a patient is selected, fetch their data from `GET /api/v1/private/patients/:id` and prominently display any `criticalNotes` in a read-only section of the form[cite: 73, 74].
- [ ] `Task:` Upon form submission, call the `POST /api/v1/private/appointments` endpoint and handle the success or error response, refreshing the calendar view on success.

Here is the continuation of the sprint plan, focusing on the remaining MVP features.

---

## Topic: Patient Critical Notes Integration 📝

**Epic:** Enhanced Patient Context at Scheduling
[cite_start]This epic is crucial for patient safety and providing personalized care, which the PRD highlights as especially important in a market where health literacy might be low[cite: 296, 297]. The goal is to give receptionists immediate access to vital patient information during the scheduling process.

### 12. [ ] Story: Display Critical Notes in Scheduling Form

As a receptionist, when I select a patient for an appointment, I want to see their critical notes displayed prominently so that I am immediately aware of important health information.

- [ ] `Task:` In the "Book New Appointment" frontend component, add a dedicated, read-only UI section to display patient alerts.
- [ ] `Task:` When a patient is selected from the search results, trigger an API call to `GET /api/v1/private/patients/:id` to fetch their full profile, including notes.
- [ ] `Task:` Style the notes section to be highly visible. [cite_start]For example, use a different background color, a warning icon, or a border to draw attention to it[cite: 292].
- [ ] `Task:` Ensure that if a patient has no critical notes, the section is either hidden or displays a "No critical notes" message.

### 13. [ ] Story: Add and Edit Patient Notes

As a receptionist, I want to be able to add or edit a patient's critical notes from their profile so that I can keep their important health information up-to-date.

- [ ] `Task:` Create a new private API endpoint `PUT /api/v1/private/patients/:id` to update a patient's record, specifically for adding or editing the `criticalNotes` field.
- [ ] `Task:` Create a simple patient profile page or modal on the frontend, accessible from a "View Patient" link or button.
- [ ] [cite_start]`Task:` On this page/modal, display the patient's details and include an editable textarea for their critical notes[cite: 294].
- [ ] `Task:` Implement a "Save Notes" button that calls the new `PUT` endpoint to persist the changes.
- [ ] [cite_start]`Task:` Ensure proper server-side validation and sanitization are in place for the notes to prevent any potential injection attacks[cite: 361].

---

## Topic: Automated & Timely Reminders 📧💬

**Epic:** Reduce No-Shows with Proactive Communication
[cite_start]This epic directly addresses the "Ineffective Reminder Systems" and "Potential for High No-Show Rates" pain points identified in the market research[cite: 239]. [cite_start]The MVP will focus on essential one-way reminders, leveraging both email and a local SMS provider to align with the high mobile penetration in Bangladesh[cite: 309].

### 14. [ ] Story: Implement Backend Service for Sending Notifications

As a backend developer, I need to set up the integrations with email and SMS providers so that the system can send automated messages.

- [ ] `Task:` Integrate the **Resend** email service using the API key from the environment variables. [cite_start]Create a wrapper service `email.service.ts` to abstract the sending logic[cite: 302].
- [ ] `Task:` Integrate **SMSLeopard** (or a similar local Bangladeshi provider) for sending SMS messages. [cite_start]Create a wrapper service `sms.service.ts` for this functionality[cite: 302].
- [ ] `Task:` Create reusable message templates for both email and SMS for appointment confirmations and reminders. [cite_start]These templates should include placeholders for patient name, date, time, dentist, and clinic name[cite: 303, 307].

### 15. [ ] Story: Send Automated Appointment Confirmations

As a patient, I want to receive an automated confirmation via email and SMS immediately after an appointment is booked so that I have a clear record of my visit.

- [ ] `Task:` Modify the appointment creation logic in `appointment.service.ts` (`POST /api/v1/private/appointments`).
- [ ] `Task:` After an appointment is successfully saved to the database, trigger the `email.service` to send a confirmation email.
- [ ] `Task:` Concurrently, trigger the `sms.service` to send a confirmation SMS.
- [ ] `Task:` Implement robust error handling for the notification-sending process. A failure to send a notification should be logged but should not cause the main appointment creation to fail.

### 16. [ ] Story: Send Automated Appointment Reminders

As a patient, I want to receive a reminder 24 hours before my appointment so that I don't forget to attend.

- [ ] [cite_start]`Task:` Develop a scheduled job (e.g., a cron job or a serverless function scheduled to run periodically) that queries the database for appointments occurring in the next 24-25 hours[cite: 306].
- [ ] `Task:` For each upcoming appointment found, the job should trigger the `email.service` and `sms.service` to send the reminder message templates.
- [ ] `Task:` Add a field to the `Appointment` model, such as `reminderSent: boolean`, to ensure reminders are only sent once per appointment.
- [ ] `Task:` Implement locking or status-checking to prevent race conditions if the cron job runs more frequently than its execution time.

---

## Topic: Deployment, Testing & QA 🚀🧪

**Epic:** Deliver a Stable, Secure, and Performant Product
This epic covers the non-functional requirements necessary to ensure the MVP is of high quality, secure, and ready for its first users.

### 17. [ ] Story: Prepare for Production Deployment

As a developer, I need to configure the project for deployment and set up monitoring so that we can launch the application and track its performance.

- [ ] [cite_start]`Task:` Sign up for a Vercel account and connect it to the project's GitHub repository[cite: 347].
- [ ] [cite_start]`Task:` Configure all production environment variables (database URI, API keys, etc.) in the Vercel project settings[cite: 347, 362].
- [ ] `Task:` Trigger a production deployment and ensure the application is accessible via the Vercel URL.
- [ ] [cite_start]`Task:` (Optional but Recommended) Acquire a custom domain and configure it in the Vercel project settings to enable automatic SSL provisioning[cite: 347].

### 18. [ ] Story: Implement Basic Analytics and Feedback

As a product manager, I want to track user behavior and gather feedback so that we can make data-driven decisions for future iterations.

- [ ] [cite_start]`Task:` Create a Google Analytics 4 (GA4) property and obtain the Measurement ID[cite: 348].
- [ ] [cite_start]`Task:` Add the GA4 tracking script to the main `layout.tsx` file in the Next.js app, using the Measurement ID from environment variables[cite: 348].
- [ ] `Task:` Implement a simple "Feedback" button in the application's UI.
- [ ] [cite_start]`Task:` Create a Google Form with key questions to gather initial user feedback[cite: 348].
- [ ] `Task:` Link the "Feedback" button to the Google Form.

### 19. [ ] Story: Implement Testing and Quality Assurance

As a developer, I need to write tests for critical application components to ensure the MVP is stable and reliable.

- [ ] [cite_start]`Task:` Write unit tests for the core backend scheduling logic, including conflict detection and availability calculation, using a framework like Jest[cite: 382].
- [ ] [cite_start]`Task:` Write integration tests for the primary API endpoints (`/appointments`, `/patients`, `/availability`) to ensure they interact correctly with the database[cite: 384].
- [ ] `Task:` Perform manual User Acceptance Testing (UAT) based on the defined user stories. [cite_start]Key scenarios to test: signing up, verifying OTP, logging in, booking an appointment for a new patient, booking an appointment for an existing patient, and seeing a conflict error when double-booking[cite: 386].
- [ ] [cite_start]`Task:` Test the application's responsiveness and functionality across major browsers (Chrome, Firefox) and on a mobile device emulator[cite: 388].
