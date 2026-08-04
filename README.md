# ระบบนิเทศการสอนออนไลน์ โรงเรียนโคกสีวิทยาสรรค์ (Teaching Supervision Web App)

เว็บแอปพลิเคชันระบบนิเทศการสอนออนไลน์ พัฒนาขึ้นโดยใช้เทคโนโลยี **React + Vite** และสไตล์ด้วย **Vanilla CSS** เพื่อช่วยให้กระบวนการจองนิเทศ จัดสรรผู้นิเทศ ตรวจสอบตาราง และส่งรายงานบันทึกหลังการจัดการเรียนรู้สะดวกรวดเร็วและเป็นระบบมากขึ้น 

---

## ฟังก์ชันเด่นของระบบ (System Features)
1. **ระบบล็อกอินตามบทบาท (Role-based Authentication)** 
   - **แอดมิน / ผู้บริหาร:** อนุมัติผู้เสนอตัว, กำหนดแต่งตั้งผู้นิเทศโดยตรง และตรวจสอบตารางนิเทศประจำวันเมื่อล็อกอินเข้าสู่ระบบ
   - **คุณครูผู้สอน:** ขอรับการนิเทศการสอน, แนบแผนการสอน (Google Drive), เสนอตัวเป็นผู้นิเทศในคาบเรียนของเพื่อนครู และเขียนรายงานบันทึกหลังสอนเมื่อเสร็จสิ้นภารกิจ
2. **ปฏิทินนิเทศแบบ Interactive (Supervision Calendar)**
   - แสดงตารางในรูปแบบปฏิทินรายเดือนที่แสดงสถานะเป็นสีต่างๆ เพื่อความชัดเจนและง่ายต่อการติดตาม
3. **ระบบเสนอตัวเป็นผู้นิเทศ (Volunteering System)**
   - ครูทุกคนสามารถอาสาเสนอตัวเข้าไปนิเทศคลาสเรียนของครูท่านอื่นได้ จากนั้นแอดมินวิชาการจะได้รับแจ้งเพื่อพิจารณากด "อนุมัติ" หรือ "ปฏิเสธ"
4. **บันทึกหลังการจัดการเรียนรู้ (Post-Teaching Report)**
   - รายงานสรุปผลสัมฤทธิ์ ปัญหา อุปสรรค และแนวทางแก้ไขหลังเสร็จสิ้นชั่วโมงการนิเทศ

---

## บัญชีผู้ใช้สำหรับทดสอบระบบ (Demo Accounts)

| ชื่อผู้ใช้งาน (Username) | รหัสผ่าน (Password) | ชื่อ-นามสกุล | บทบาท (Role) |
|---|---|---|---|
| `academic` | `123` | ครูวิชาการ (แอดมิน) | แอดมินวิชาการ |
| `admin` | `123` | ผอ.สมเกียรติ ยิ่งใหญ่ | ผู้อำนวยการโรงเรียน (แอดมิน) |
| `somchai` | `123` | ครูสมชาย ดีงาม | ครูผู้สอน |
| `somsri` | `123` | ครูสมศรี แสนดี | ครูผู้สอน |
| `wilai` | `123` | ครูวิไล รักเรียน | ครูผู้สอน |
| `wittaya` | `123` | ครูวิทยา เก่งกล้า | ครูผู้สอน |

---

## ขั้นตอนการติดตั้งและการเปิดใช้งานในเครื่อง (Local Setup Guide)

### สิ่งที่จำเป็นต้องมีในเครื่อง (Prerequisites)
- [Node.js](https://nodejs.org/) (แนะนำเวอร์ชัน LTS ล่าสุด)

### การติดตั้งและรันระบบ
1. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```
2. **รันเซิร์ฟเวอร์สำหรับทดสอบพัฒนา (Development Mode):**
   ```bash
   npm run dev
   ```
3. **เข้าใช้งานผ่านเว็บเบราว์เซอร์:**
   เปิดลิงก์ที่แสดงใน Terminal เช่น `http://localhost:5173`

---

## คู่มือการอัปโหลดโค้ดขึ้น GitHub และการทำงานร่วมกับผู้อื่น (GitHub & Collaboration Guide)

เพื่อให้คุณครูหรือผู้ร่วมพัฒนาท่านอื่นมาร่วมทำต่อได้ทันที สามารถทำตามขั้นตอนต่อไปนี้:

### 1. การส่งโปรเจกต์นี้ขึ้น GitHub (Push to GitHub)
1. **สมัครสมาชิกและล็อกอิน** ที่ [GitHub](https://github.com/)
2. **สร้าง Repository ใหม่:**
   - กดปุ่ม **New** (หรือเครื่องหมาย `+` ที่มุมขวาบน)
   - ตั้งชื่อ Repository (เช่น `ks-teaching-supervision`)
   - ตั้งเป็น **Public** เพื่อเปิดเป็นสาธารณะ (หรือ Private หากต้องการจำกัดผู้ใช้)
   - **ห้าม** ติ๊กเลือก Add a README file, Add .gitignore หรือ Choose a license (เพราะโปรเจกต์เรามีไฟล์เหล่านี้เตรียมไว้ให้หมดแล้ว)
   - กดปุ่ม **Create repository**
3. **เปิด Terminal (PowerShell หรือ Command Prompt) ในโฟลเดอร์นี้ แล้วรันคำสั่งดังนี้:**
   ```bash
   # เริ่มต้นสร้าง Git Repository ในเครื่อง
   git init

   # เพิ่มไฟล์ทั้งหมดเข้าในสถานะเตรียม Commit
   git add .

   # Commit ครั้งแรก
   git commit -m "Initial commit for KS Teaching Supervision App"

   # เปลี่ยนชื่อสาขาหลักเป็น main
   git branch -M main

   # เชื่อมโยงโฟลเดอร์เครื่องเรากับลิงก์ GitHub (ให้เปลี่ยน URL เป็นลิงก์ Repository ของคุณ)
   git remote add origin https://github.com/ชื่อผู้ใช้ของคุณ/ks-teaching-supervision.git

   # ส่งไฟล์ขึ้น GitHub
   git push -u origin main
   ```

### 2. การอนุญาตให้เพื่อนร่วมพัฒนาแอปนี้ได้ (Invite Collaborators)
หากต้องการให้เพื่อนสามารถดาวน์โหลด แก้ไข และกดยืนยันอัปเดตโค้ดขึ้นมาบน Repository เดียวกันได้:
1. ไปที่หน้าหน้าเว็บ Repository ของคุณบน GitHub
2. คลิกที่เมนู **Settings** (ตั้งค่า)
3. ด้านซ้ายมือ คลิกที่ **Collaborators**
4. กดปุ่ม **Add people** (เพิ่มคน)
5. ค้นหาด้วย **ชื่อผู้ใช้ GitHub (Username)** หรือ **อีเมล** ของเพื่อน
6. เลือกเพื่อนและกดส่งคำเชิญ เพื่อนจะได้รับอีเมลคำเชิญเพื่อกดยอมรับการร่วมพัฒนา

### 3. สำหรับเพื่อนที่จะมาร่วมพัฒนา (For Collaborators)
เมื่อเพื่อนกดยอมรับคำเชิญแล้ว เพื่อนสามารถทำตามขั้นตอนนี้เพื่อนำโค้ดไปรันและพัฒนาต่อได้:
1. **คัดลอกโค้ดลงเครื่อง (Clone Project):**
   ```bash
   git clone https://github.com/ชื่อผู้ใช้ของคุณ/ks-teaching-supervision.git
   ```
2. เข้าโฟลเดอร์โปรเจกต์ ติดตั้ง package และรันระบบ:
   ```bash
   cd ks-teaching-supervision
   npm install
   npm run dev
   ```
3. เมื่อแก้ไขหรือพัฒนาฟีเจอร์เพิ่มเติมเสร็จแล้ว สามารถส่งโค้ดขึ้น GitHub ได้โดยรัน:
   ```bash
   git add .
   git commit -m "อธิบายสิ่งที่แก้ไข เช่น เพิ่มแท็กระบุหมวดหมู่"
   git push origin main
   ```

---

## Security

- **Passwords are hashed, but the database is not yet locked down.** Passwords are stored as bcrypt hashes (see `src/utils/auth.js`) and legacy plaintext accounts are migrated to a hash automatically on next successful login. That stops passwords from being readable at rest or displayed in the UI, but it does **not** by itself secure the database — the Firebase config shipped in the built JS bundle is enough for anyone to talk to Firestore directly, bypassing the app entirely, until real Firestore Security Rules and Firebase Authentication are both in place.
- **Firestore Security Rules must be deployed via the Firebase Console.** A baseline rules file is included at [`firestore.rules`](./firestore.rules), but this repository has no way to deploy it automatically (no `gh`/Firebase CLI access wired into CI). Whoever administers the Firebase project needs to paste `firestore.rules` into **Firebase Console → Firestore Database → Rules** (or deploy it with the Firebase CLI) by hand. As written, that rules file assumes Firebase Authentication is wired into the client — which this app does not yet do (see the comment at the top of the file) — so integrating real Firebase Auth is a required follow-up before the rules file will do anything useful.
- **The live production Firestore currently rejects all reads/writes.** As of this writing, requests from the deployed app to Firestore fail with `permission-denied`. In practice this means the deployed app is running in local-only, no-sync mode (falling back to `localStorage`) for real users until whatever rules currently exist in the Firebase Console are fixed. This is a Firebase Console configuration issue, not something fixable from this repository's code.
