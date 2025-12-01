# Gmail SMTP Setup Guide

If you're using Gmail to send the newsletter, follow these steps:

## 1. Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** if not already enabled

## 2. Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or search for "App passwords" in Google Account settings
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter name: **Crypto Newsletter**
5. Click **Generate**
6. Copy the 16-character password (shown in yellow box)

## 3. Configure .env File

Add to your `.env` file:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_16_char_app_password_here
FROM_EMAIL=your.email@gmail.com
TO_EMAILS=recipient@example.com
NEWSLETTER_TITLE=Crypto Daily Newsletter
```

**Important:**
- Use the **App Password**, NOT your regular Gmail password
- Remove spaces from the App Password (it's usually shown as xxxx xxxx xxxx xxxx)
- The App Password should be 16 characters

## 4. Gmail Sending Limits

**Free Gmail accounts:**
- 500 emails per day
- 500 recipients per message

**Google Workspace (paid):**
- 2,000 emails per day

For this newsletter (1 email per day), you're well within limits.

## Common Issues

### "Invalid login: 535-5.7.8 Username and Password not accepted"
- You're using your regular password instead of App Password
- Generate a new App Password and use that

### "Less secure app access"
- This is no longer an issue with App Passwords
- App Passwords are the secure way to authenticate

### "Daily sending limit exceeded"
- You've hit Gmail's 500/day limit
- Wait 24 hours or upgrade to Google Workspace

## Alternative: Use SendGrid or Mailgun

For higher volume or more reliability, consider dedicated email services:

**SendGrid:**
- Free tier: 100 emails/day
- SMTP: `smtp.sendgrid.net:587`

**Mailgun:**
- Free tier: 5,000 emails/month
- SMTP: `smtp.mailgun.org:587`

Both require API keys instead of passwords.
