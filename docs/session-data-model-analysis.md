# Academic Session Data Model: বিশ্লেষণ ও প্রস্তাবনা

## উদ্দেশ্য

এই ডকুমেন্টে admin app ও API-তে academic session বর্তমানে কীভাবে কাজ করে, একই academic period একাধিক department বা batch-এ ব্যবহৃত হলে কীভাবে duplicate record এড়ানো যায়, এবং সম্ভাব্য নকশার প্রস্তাব রাখা হয়েছে।

## বাস্তবায়নের বর্তমান অবস্থা (২০২৬-১১-০২)

- API, admin ও Flutter-এ session এখন global catalog: `kind`, `start_year` ও `term` দিয়ে period নির্ধারিত হয়; কোন batch-এ কোন session প্রযোজ্য তা `batch_sessions` relation ধরে।
- Production migration সফলভাবে চালানো হয়েছে। একই period-এর duplicate session row একত্র করা হয়েছে; student, verification request ও batch reference canonical row-তে সরানো হয়েছে। পুরোনো `slug`, `university_id`, `department_id` ও `is_active` session columns বাদ দেওয়া হয়েছে।
- ফলে কার্যকর নকশাটি বিকল্প A-এর university-scoped model নয়; এটি বিকল্প C-এর global period catalog-এর কাছাকাছি, যেখানে batch হলো assignment scope। এই model ধরে নেয় যে একই `kind/start_year/term` সব university-তে একই period বোঝায়।
- কোনো university-তে একই period label-এর আলাদা অর্থ বা lifecycle থাকলে বর্তমান schema তা আলাদা করে প্রকাশ করতে পারে না। এমন প্রয়োজন নিশ্চিত হলে নতুন scope/assignment model ডিজাইন করতে হবে; শুধু duplicate label দেখে row আবার merge বা split করা যাবে না।

## বর্তমান আচরণ

- একটি session-এ name, slug, university ID, ঐচ্ছিক department ID এবং active status থাকে। দেখুন [`Session`](../../campusassistant-api/internal/domain/session.go)।
- Department details page department অনুযায়ী session আনে। Add/edit form university ও department—দুটির ID-ই পাঠায়। দেখুন [`department-detail-client.tsx`](../app/universities/[id]/departments/[...slug]/department-detail-client.tsx) এবং [`SessionModal.tsx`](../app/universities/[id]/departments/[...slug]/components/SessionModal.tsx)।
- `batch_sessions` many-to-many relation দিয়ে একটি batch একাধিক session-এর সঙ্গে যুক্ত হতে পারে, এবং একই session একাধিক batch-এ ব্যবহার করা যায়। দেখুন [`Batch`](../../campusassistant-api/internal/domain/batch.go)।
- Batch editor university অনুযায়ী session আনে, তারপর batch তৈরি বা edit করার সময় বেছে নেওয়া session ID পাঠায়। ফলে batch বিদ্যমান session reuse করতে পারে; তবে picker-এ ওই university-র অন্য department-এর session-ও আসতে পারে। দেখুন [`BatchModal.tsx`](../app/universities/[id]/departments/[...slug]/components/BatchModal.tsx)।
- প্রত্যেক student-এর `session_id` সরাসরি একটি session record-কে নির্দেশ করে। দেখুন [`Student`](../../campusassistant-api/internal/domain/student.go)।
- Admin form লোড করা session-গুলোর মধ্যে duplicate name পরীক্ষা করে, কিন্তু এটি database uniqueness constraint-এর বিকল্প নয়। এখানে দেখা model-এ session-এর scope ও name-এর জন্য unique constraint ঘোষণা করা নেই। বাস্তবায়নের আগে database constraint ও migration যাচাই করতে হবে।
- Bulk session generation-এ দেওয়া শেষ বছরটি exclusive boundary: ২০০০ ও ২০২৪ দিলে `2000-2001` থেকে `2023-2024` পর্যন্ত তৈরি হয়।

## Duplicate হওয়ার কারণ

Session-এ department ID থাকতে পারে এবং department screen সেটি দিয়ে session তৈরি করে। তাই ভিন্ন department-এ একই period (যেমন `2020-2021`) আলাদা row হিসেবে থাকতে পারে। Department-গুলোর academic calendar আলাদা হলে এটি উপকারী; কিন্তু একই university-র department-গুলো একই calendar অনুসরণ করলে এটি অপ্রয়োজনীয় duplicate।

Batch relation ইতিমধ্যেই reuse সমর্থন করে: একাধিক batch একই session row-কে নির্দেশ করতে পারে। সুতরাং duplicate হওয়ার জন্য প্রতি batch-এ নতুন session দরকার হয় না; একই period বারবার আলাদা session row হিসেবে তৈরি করলেই duplicate হয়।

## নকশার বিকল্প

### বিকল্প A: University-wide session (department-গুলো একই calendar অনুসরণ করলে সুপারিশকৃত)

প্রতি university-তে প্রতিটি academic period-এর জন্য একটি session record থাকবে। সংশ্লিষ্ট department-এর batch-গুলো সেই record reuse করবে।

**সুবিধা**

- University-র ভেতরে একই session-এর পুনরাবৃত্তি কমে।
- Period ও status যে university-র academic calendar-এর অংশ, তার সঙ্গেই যুক্ত থাকে।
- বর্তমান batch-to-session ও student-to-session reference রাখা যায়।

**বিবেচ্য বিষয়**

- যেসব department-এর calendar সত্যিই আলাদা, তাদের জন্য সেই পার্থক্য প্রকাশের স্পষ্ট ব্যবস্থা লাগবে।
- Session management ও selection-এ একই university scope অনুসরণ করতে হবে; বর্তমান department-only session list ও university-wide batch picker একরকম করতে হবে।

### বিকল্প B: Department-specific session

বর্তমান scope রেখে প্রতিটি department-এর জন্য period আলাদাভাবে তৈরি করা।

**সুবিধা**

- Department নিজস্ব period ও active status পরিচালনা করতে পারে।
- ভিন্ন calendar থাকা department-এর জন্য উপযুক্ত।

**বিবেচ্য বিষয়**

- Department-গুলো একই calendar ব্যবহার করলে row পুনরাবৃত্তি হয়।
- ভুল করে অন্য department-এর session batch-এ যুক্ত হওয়া ঠেকাতে batch picker department অনুযায়ী সীমাবদ্ধ করতে হবে।

### বিকল্প C: Global academic-period catalog এবং scope অনুযায়ী assignment

Period-টি (যেমন canonical `2020-2021`) একবার সংরক্ষণ করে আলাদাভাবে university বা department-এর সঙ্গে যুক্ত করা। Batch প্রযোজ্য assignment/period-এর সঙ্গে যুক্ত হবে।

**সুবিধা**

- Department-এর পাশাপাশি ভিন্ন university-তেও একই year-range identity পুনরাবৃত্তি এড়ানো যায়।
- Period-এর সংজ্ঞা এবং কোথায় সেটি ব্যবহৃত হচ্ছে—দুটো আলাদা রাখা যায়।

**বিবেচ্য বিষয়**

- Schema ও relation-এর জটিলতা বাড়ে।
- Period-এর university-specific অর্থ বা metadata না থাকলেই global sharing উপযুক্ত। Active status, calendar difference ও ownership তবুও scoped record-এ রাখতে হতে পারে।

## সুপারিশ

প্রতিটি university-র department-গুলো সাধারণত একই academic calendar অনুসরণ করলে **বিকল্প A** দিয়ে শুরু করুন: university-র ভেতরে session unique রাখুন এবং batch-গুলোকে সেটি reuse করতে দিন। Department-specific ব্যতিক্রম থাকলে university ও department scope নীরবে মিশিয়ে না দিয়ে সেটিকে স্পষ্ট requirement হিসেবে নির্ধারণ করুন।

Department-গুলোর calendar নিয়মিত আলাদা হলে বা session lifecycle আলাদাভাবে পরিচালনার প্রয়োজন হলে **বিকল্প B** বেছে নিন। University-গুলোর মধ্যে global catalog-এর নির্দিষ্ট প্রয়োজন থাকলেই **বিকল্প C** নিন; শুধু batch-গুলোর মধ্যে session reuse করতে global catalog দরকার নেই।

যে scope-ই বেছে নেওয়া হোক, নির্বাচিত scope ও normalized period অনুযায়ী database-এ uniqueness enforce করতে হবে এবং API-তে relation-এর scope validate করতে হবে। শুধু UI-তে duplicate check থাকলে একই সময়ে আসা বা admin UI-এর বাইরে করা API request থেকে duplicate তৈরি ঠেকানো যায় না।

## Migration ও compatibility বিবেচনা

Schema পরিবর্তনের আগে:

1. Canonical scope university নাকি department হবে এবং department-specific exception থাকবে কি না ঠিক করুন।
2. বিদ্যমান session row-গুলোতে নির্বাচিত scope অনুযায়ী duplicate period আছে কি না audit করুন।
3. প্রতিটি duplicate group-এর জন্য canonical row নির্বাচন করুন। Duplicate row সরানো বা archive করার আগে `batch_sessions` link এবং student-এর `session_id` canonical row-তে repoint করুন।
4. নতুন নিয়মে scope-এর বাইরে চলে যাবে এমন session-এ কোনো student বা batch যুক্ত আছে কি না পরীক্ষা করুন।
5. বিদ্যমান duplicate সমাধানের পর database constraint যোগ করুন।
6. Session list, create/edit form, batch picker ও student session picker একসঙ্গে update করুন, যাতে সবাই একই scope অনুসরণ করে।
7. API compatibility বজায় রাখুন অথবা admin, API ও mobile-app release সমন্বয় করুন: student profile এবং Flutter app-ও session ID ব্যবহার করে।

Migration-এর আগে backup নিন এবং staging copy-তে পরীক্ষা করুন। University/department ownership ও সব reference যাচাই না করে শুধু একই name দেখে row merge করবেন না।

## বাস্তবায়নের আগে সিদ্ধান্তের প্রশ্ন

- একই university-র সব department কি একই academic session ব্যবহার করে, নাকি বাস্তব ব্যতিক্রম আছে?
- Session-এর active/inactive status কি university-wide, নাকি department-specific?
- Batch কি শুধু নিজের department-এর session বেছে নিতে পারবে, নাকি university-র যেকোনো department-এর?
- Formatted name/slug-এর ওপর নির্ভর না করে year range কি start year ও end year হিসেবে রাখা উচিত?
- বিদ্যমান duplicate কীভাবে সামলানো হবে: reference merge, alias রাখা, নাকি historical row অক্ষত রাখা?
