-- Starter content. Run AFTER migrations/0001_init.sql.
-- Only facts from the project brief are used. Descriptions are drafts for
-- the Foundation to review and edit from /admin. Partners stay unpublished
-- until permission to show their names is confirmed.

insert into public.programs (slug, title_en, title_bn, summary_en, summary_bn, icon, sort_order, is_published)
values
  ('education', 'Education', 'শিক্ষা',
   'Helping children and young people in Mirpur-13 keep learning.',
   'মিরপুর-১৩ এলাকার শিশু ও তরুণদের পড়াশোনা চালিয়ে যেতে সহায়তা।',
   'book-open', 1, true),
  ('healthcare', 'Healthcare', 'স্বাস্থ্যসেবা',
   'Connecting families with basic health support and care.',
   'পরিবারগুলোকে প্রাথমিক স্বাস্থ্য সহায়তা ও সেবার সাথে যুক্ত করা।',
   'stethoscope', 2, true),
  ('community-building', 'Community Building', 'কমিউনিটি উন্নয়ন',
   'Neighbours working together through volunteering and local action.',
   'স্বেচ্ছাসেবা ও স্থানীয় উদ্যোগের মাধ্যমে প্রতিবেশীরা একসাথে কাজ করছেন।',
   'users', 3, true)
on conflict (slug) do nothing;

insert into public.faqs (question_en, question_bn, answer_en, answer_bn, sort_order)
select * from (values
  ('How can I volunteer?', 'আমি কীভাবে স্বেচ্ছাসেবক হতে পারি?',
   'Fill in the volunteer form on the Get Involved page. A coordinator will contact you by phone.',
   '"যুক্ত হোন" পৃষ্ঠার স্বেচ্ছাসেবক ফর্মটি পূরণ করুন। একজন সমন্বয়ক ফোনে আপনার সাথে যোগাযোগ করবেন।', 1),
  ('How can I support the Foundation financially?', 'আমি কীভাবে আর্থিকভাবে সহায়তা করতে পারি?',
   'The Contribute page lists the Foundation''s official payment details. Please use only the details shown there.',
   '"অবদান রাখুন" পৃষ্ঠায় ফাউন্ডেশনের অফিসিয়াল পেমেন্টের তথ্য দেওয়া আছে। অনুগ্রহ করে শুধুমাত্র সেখানে দেওয়া তথ্য ব্যবহার করুন।', 2),
  ('How do I ask for help?', 'আমি কীভাবে সহায়তার জন্য আবেদন করব?',
   'Use the Request Assistance form. Your details are seen only by the Foundation''s authorised staff.',
   '"সহায়তার আবেদন" ফর্মটি ব্যবহার করুন। আপনার তথ্য শুধুমাত্র ফাউন্ডেশনের অনুমোদিত কর্মীরা দেখতে পারেন।', 3),
  ('Where do you work?', 'আপনারা কোথায় কাজ করেন?',
   'Mainly in Mirpur-13, Dhaka, where the Foundation has served the community since 2019.',
   'মূলত ঢাকার মিরপুর-১৩ এলাকায়, যেখানে ফাউন্ডেশন ২০১৯ সাল থেকে কাজ করছে।', 4)
) v(question_en, question_bn, answer_en, answer_bn, sort_order)
where not exists (select 1 from public.faqs);

insert into public.partners (name, website_url, sort_order, is_published)
select * from (values
  ('WeCareBD Foundation', 'https://wecarebd.org', 1, false),
  ('Lions', null::text, 2, false)
) v(name, website_url, sort_order, is_published)
where not exists (select 1 from public.partners);

insert into public.team_members (name_en, name_bn, role_en, role_bn, team_group, sort_order, is_published)
select 'Sharmin Nasima Banu', 'শারমিন নাসিমা বানু', 'Founder', 'প্রতিষ্ঠাতা', 'founder', 1, true
where not exists (select 1 from public.team_members where team_group = 'founder');
