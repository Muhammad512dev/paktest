# Domain Setup & Automated Google Drive Backups

This guide explains how to connect your Namecheap domain to your VPS and set up an automated daily backup system that securely saves your database and uploaded files to Google Drive.

---

## Part 1: Connect Namecheap Domain to VPS

1. Log into your [Namecheap Dashboard](https://www.namecheap.com/).
2. Click **Domain List** on the left sidebar and click **Manage** next to your domain.
3. Click on the **Advanced DNS** tab.
4. Under the **Host Records** section, add the following two records (delete any existing default parking records):

   | Type | Host | Value (IP Address) | TTL |
   | :--- | :--- | :--- | :--- |
   | **A Record** | `@` | `YOUR_VPS_IP_ADDRESS` | Automatic |
   | **A Record** | `www` | `YOUR_VPS_IP_ADDRESS` | Automatic |

*(Note: DNS changes can take a few minutes to propagate. Once connected, your Nginx and Certbot SSL steps from the deployment guide will work perfectly).*

---

## Part 2: Setup Automated Backups to Google Drive

We will use a tool called `rclone`, which is the industry standard for syncing VPS data to cloud storage like Google Drive.

### Step 1: Install Rclone on your VPS
SSH into your Ubuntu VPS and run:
```bash
sudo -v ; curl https://rclone.org/install.sh | sudo bash
```

### Step 2: Authenticate with Google Drive
Run the configuration wizard:
```bash
rclone config
```
1. Type `n` for **New remote** and name it `gdrive`.
2. For the storage type, look for **Google Drive** in the list and type its corresponding number (usually around `18` or `13`).
3. Leave `client_id` and `client_secret` blank (just press Enter).
4. For scope, choose `1` (Full access).
5. Leave `root_folder_id` and `service_account_file` blank.
6. When asked to "Edit advanced config?", type `n`.
7. When asked "Use auto config?", type `n` (because your VPS doesn't have a web browser).
8. **IMPORTANT:** Rclone will give you a command that looks like `rclone authorize "drive" "ey..."`. You must copy that command, run it on your **local computer's terminal** (where you have a browser), sign into Google, and it will give you an auth token. Paste that auth token back into your VPS.
9. Type `n` when asked if this is a Team Drive.
10. Type `y` to confirm and save.

### Step 3: Configure the Backup Script
I have created a script in your project root called `backup-to-drive.sh`. 

Upload this script to your VPS (e.g., to `/root/backup-to-drive.sh` or your home directory).
Make it executable:
```bash
chmod +x ~/backup-to-drive.sh
```

*(You can test it by running `./backup-to-drive.sh`. It will take a snapshot of the PostgreSQL database and compress the uploaded PDFs/images, then upload them to a folder named "Paktest_Backups" in your Google Drive).*

### Step 4: Schedule Daily Backups (Cron Job)
To make this run automatically every single day at 2:00 AM (server time), we add it to the cron scheduler.

Open the cron editor:
```bash
crontab -e
```
Scroll to the bottom of the file and paste this line (assuming the script is in your home directory):
```bash
0 2 * * * /home/username/backup-to-drive.sh >> /home/username/backup.log 2>&1
```
*(Replace `username` with your actual Ubuntu username, like `ubuntu` or `root`).*

Save and exit. Your server will now automatically dump your database, zip your files, and push them safely to Google Drive every night!
