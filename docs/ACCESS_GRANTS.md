# Access Grants: Admin গাইড

Access Grant দিয়ে admin panel থেকে নির্দিষ্ট কিছু user-কে নির্দিষ্ট সময়ের জন্য **ad ছাড়া** বা **coin ছাড়া** app ব্যবহার করতে দেওয়া যায়। এটা Pro subscription না। User কোনো টাকা দেয় না, Pro-ও হয় না। শুধু নির্দিষ্ট সুবিধাগুলো চালু হয়।

Panel-এ যাবেন: **Monetization → Access Grants**

---

## কখন কাজে লাগে

- **নতুন campus বা শহরে ঢোকার সময়।** "তোমাদের campus-এ ডিসেম্বর পর্যন্ত সব free" বলে student-দের আনা যায়।
- **নতুন user ধরে রাখতে।** প্রথম কয়েক দিন ad না দেখালে user app-এর আসল মূল্য দেখে, চলে যায় না।
- **কোনো department বা club-এর সাথে partnership হলে।**
- **পরীক্ষার সময় একটা batch-কে free download দিতে।**
- **CR, ambassador বা contributor-দের পুরস্কার দিতে।**

---

## মূল ধারণা: কাকে + কী + কতদিন

প্রতিটা grant-এ চারটা জিনিস ঠিক করতে হয়।

### ১. কাকে (Who gets it)

| Scope | কে পায় |
|---|---|
| **Everyone** | App-এর সব account |
| **University** | ওই university-র সব student, teacher আর staff |
| **Department** | ওই department-এর সবাই |
| **Batch** | ওই batch-এর student-রা |
| **User** | একজন নির্দিষ্ট মানুষ। নাম বা email দিয়ে খুঁজে বের করবেন |

University, department বা batch বেছে নিতে হয় ধাপে ধাপে: আগে university, তারপর department, তারপর batch।

### ২. কী (Perks)

| Perk | কী হয় |
|---|---|
| **Ad-free** | কোনো ad দেখায় না: banner, download-এর আগের ad, video ad কিছুই না |
| **Coin-free downloads** | Download-এ coin কাটে না। "Out of coins" dialog আর তার ad-ও আসে না |

সাধারণত দুটোই একসাথে দেবেন। Grant বানাতে অন্তত একটা perk বেছে নিতেই হবে।

> **মনে রাখবেন:** Pro-only content কোনো grant দিয়েই খোলে না। ওটার জন্য Pro লাগবেই।

### ৩. কতদিন (Starts / Ends)

- **Starts:** খালি রাখলে এখনই শুরু। ভবিষ্যতের তারিখ দিলে সেদিন নিজে থেকে শুরু হবে। তার আগ পর্যন্ত status থাকবে **Scheduled**।
- **Ends:** খালি রাখলে কখনো শেষ হবে না।

### ৪. শুধু নতুন account (Only new accounts, days)

- **0 দিলে** scope-এর সবাই পাবে, পুরনো আর নতুন দুই ধরনের user-ই।
- **কোনো সংখ্যা দিলে, যেমন 7,** শুধু নতুন account-গুলো পাবে। প্রতিটা account পাবে তার signup-এর পর প্রথম ৭ দিন। পুরনো user-রা পাবে না।

এটা দিয়েই "নতুন user welcome" বানানো হয়। নিচে উদাহরণ আছে।

---

## User app-এ কী দেখে

| অবস্থা | User যা দেখে |
|---|---|
| **Grant চলাকালীন** | Home page-এর উপরে সবুজ badge, যেমন: "DU CSE launch · No ads · free downloads · 12 days left"। এখানে **Label**-এ যা লিখবেন সেটাই দেখায় |
| **শেষ হওয়ার ৩ দিন আগে** | Badge হলুদ হয়ে যায়: "...After that, coins skip the ads." যাতে ad ফিরে এলে user অবাক না হয় |
| **Grant শেষ হওয়ার পর** | একবার coin-এর welcome popup আসে, যেখানে বোঝানো থাকে coin কীভাবে কাজ করে। তারপর স্বাভাবিক নিয়ম: coin থাকলে ad নেই, coin না থাকলে download-এর আগে ছোট ad |
| **Coin-free চলাকালীন** | Resource card-এ coin cost দেখায় না। Info sheet-এ লেখা থাকে "FREE NOW" |

Pro user-রা badge দেখে না, কারণ তাদের সব এমনিতেই free।

**কখন কার্যকর হয়:** User app খুললে বা profile refresh হলে নতুন grant পায়। Grant শেষ হলে app নিজেই তারিখ দেখে সুবিধা বন্ধ করে দেয়। আর server-ও আলাদাভাবে নিয়ম মানে: coin-free user-এর coin কখনো কাটে না, পুরনো app version-এও।

---

## ধাপে ধাপে কাজ

### নতুন grant তৈরি

1. **Monetization → Access Grants**-এ গিয়ে **New Grant** চাপুন।
2. চাইলে উপরের **Start from** থেকে একটা template বেছে নিন। Form পূরণ হয়ে যাবে, পরে সব বদলানো যায়:
    - **New user welcome:** Everyone · ad-free + coin-free · নতুন account-এর প্রথম ৭ দিন
    - **Campus launch:** University · ad-free + coin-free
    - **Exam season:** Batch · coin-free
    - **Ambassador:** User · ad-free + coin-free · শেষ নেই
3. **Label** লিখুন। এটা user-রা app-এর badge-এ দেখবে, তাই সুন্দর করে লিখবেন। যেমন "DU CSE launch", "Final exam offer"।
4. **Who gets it** থেকে scope বেছে নিয়ে university, department, batch বা user ঠিক করুন।
5. **Perks** বেছে নিন।
6. **Starts / Ends** দিন।
7. দরকার হলে **Only new accounts (days)** দিন।
8. **Create Grant** চাপুন।

### List-এ যা দেখা যায়

| কলাম | মানে |
|---|---|
| **Label** | Grant-এর নাম |
| **Who** | কাকে দেওয়া হয়েছে, যেমন "CSE · University of Dhaka" |
| **Perks** | Ad-free আর/অথবা Coin-free |
| **When** | শুরু → শেষ (∞ মানে শেষ নেই)। নতুন-account grant হলে নিচে "First N days of each new account" লেখা থাকে |
| **Users** | ওই scope-এ মোট কতজন registered user আছে। "Only new accounts" grant-এ আসলে এর চেয়ে কম মানুষ পাবে |
| **Status** | **Active** = এখন চলছে · **Scheduled** = ভবিষ্যতে শুরু হবে · **Ended** = শেষ |

### Edit

✏️ চাপুন। সব কিছু বদলানো যায়। Scope বদলাতে "Change" চাপবেন। শুরুর তারিখ না বদলালে আগেরটাই থাকবে।

### End now (⏹)

Grant এখনই শেষ করে দেয়, কিন্তু history-তে রেখে দেয়। **Grant বন্ধ করতে চাইলে সাধারণত এটাই ব্যবহার করবেন।** User-রা পরের বার app খুললে বা profile refresh হলে সুবিধা হারাবে।

### Delete (🗑)

Grant পুরোপুরি মুছে দেয়, history থেকেও। শুধু ভুল করে বানানো grant-এর জন্য ব্যবহার করবেন।

---

## বাস্তব উদাহরণ

### নতুন user welcome (সবার আগে এটা বানাবেন)

**এটা নিজে থেকে চালু হয় না। একবার বানিয়ে রাখতে হবে।**

| Field | মান |
|---|---|
| Label | Welcome offer |
| Who | Everyone |
| Perks | Ad-free + Coin-free |
| Starts | খালি (এখন থেকে) |
| Ends | খালি (শেষ নেই) |
| Only new accounts | 7 |

ফল: এখন থেকে যে-ই account খুলবে, প্রথম ৭ দিন সব free পাবে। পুরনো user-দের ওপর এর কোনো প্রভাব নেই।

### নতুন campus launch

| Field | মান |
|---|---|
| Label | CU launch offer |
| Who | University → Chittagong University |
| Perks | Ad-free + Coin-free |
| Ends | 2026-12-31 |
| Only new accounts | 0 |

ফল: ওই university-র সবাই, পুরনো আর নতুন, ৩১ ডিসেম্বর পর্যন্ত free পাবে। Campus-এ গিয়ে বলবেন: "ডিসেম্বর পর্যন্ত সম্পূর্ণ free, কোনো ad নেই।"

### Batch-এর exam season

| Field | মান |
|---|---|
| Label | Final exam offer |
| Who | Batch → DU → CSE → Batch 27 |
| Perks | Coin-free |
| Starts / Ends | পরীক্ষার শুরু থেকে শেষ, ২ সপ্তাহ |

ফল: পরীক্ষার সময় ওই batch যত খুশি download করতে পারবে, কোনো coin বা ad ছাড়া।

### Department partnership

| Field | মান |
|---|---|
| Label | JU Pharmacy partner |
| Who | Department → JU → Pharmacy |
| Perks | Ad-free + Coin-free |
| Ends | ৩ মাস পরের তারিখ |

### CR / Ambassador

| Field | মান |
|---|---|
| Label | Campus Ambassador |
| Who | User → নাম বা email দিয়ে খুঁজুন |
| Perks | Ad-free + Coin-free |
| Ends | খালি (শেষ নেই), অথবা দায়িত্বের মেয়াদ |

দায়িত্ব শেষ হলে **End now** চাপবেন।

---

## একাধিক grant মিললে কী হয়

একজন user একসাথে কয়েকটা grant-এর আওতায় পড়তে পারে। যেমন সে DU-এর launch offer-এ আছে, আবার নিজে একজন ambassador-ও।

- **প্রতিটা perk আলাদাভাবে হিসাব হয়।** যেকোনো একটা grant ad-free দিলে user ad-free। যেকোনো একটা coin-free দিলে coin-free।
- **মেয়াদ ধরা হয় যেটা সবচেয়ে পরে শেষ হয় সেটা।** যেমন একটা ৩১ ডিসেম্বর, আরেকটা শেষ নেই, তাহলে শেষ নেই।
- **Badge-এ দেখায় সবচেয়ে লম্বা grant-এর Label।**

## সতর্কতা ও সীমাবদ্ধতা

- **শুধু Ad-free দিলে (Coin-free ছাড়া):** user-এর coin থাকলে download-এ coin কাটবে। Coin শেষ হলে ad ছাড়াই download হবে, কারণ তখন দেখানোর মতো কোনো ad নেই। তাই সাধারণত দুটো perk একসাথেই দেবেন।
- **Grant user-কে Pro বানায় না।** Pro-only content বন্ধই থাকে।
- **নতুন account grant-এর অপব্যবহার:** কেউ বারবার নতুন account খুলে free দিন নিতে পারে। এজন্য দিনের সংখ্যা ছোট রাখবেন (৭ দিন যথেষ্ট)।
- **"Users" কলামের সংখ্যা আনুমানিক:** ওটা scope-এর মোট registered user-এর সংখ্যা। "Only new accounts" grant-এ আসলে অনেক কম মানুষ পায়।
- **Batch grant শুধু student-রা পায়।** Batch-এর তথ্য student profile থেকে আসে।

---

## সাধারণ প্রশ্ন

**Grant বানালাম, কিন্তু user এখনো ad দেখছে কেন?**
User-এর app এখনো পুরনো profile দেখাচ্ছে। App বন্ধ করে আবার খুললে বা কিছুক্ষণ পরে ঠিক হয়ে যাবে। তারপরও না হলে দেখুন:
- Status **Active** কিনা। **Scheduled** হলে শুরুর তারিখ এখনো আসেনি।
- User আসলেই ওই university, department বা batch-এ আছে কিনা।
- Perk-এ **Ad-free** চালু আছে কিনা।
- User-এর app নতুন version কিনা।

**Grant শেষ করলাম, কিন্তু user এখনো free পাচ্ছে কেন?**
Server-এ coin কাটা সাথে সাথে চালু হয়ে যায়। কিন্তু app-এ ad ফিরতে user-কে app আবার খুলতে হতে পারে।

**ভবিষ্যতের কোনো তারিখ থেকে offer শুরু করা যায়?**
হ্যাঁ। **Starts**-এ সেই তারিখ দিন। ততদিন status থাকবে **Scheduled**।

**ভুল করে grant বানিয়ে ফেলেছি।**
এখনো কেউ ব্যবহার না করে থাকলে **Delete** করুন। নাহলে **End now** চাপুন, তাতে history থেকে যাবে।

**একজন user কোন কোন grant পাচ্ছে, সেটা কোথায় দেখব?**
এখনো আলাদা কোনো page নেই। List-এ Who কলাম দেখে মিলিয়ে নিতে হবে।
