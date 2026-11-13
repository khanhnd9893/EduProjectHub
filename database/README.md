# Database setup for XAMPP

The application uses one MySQL database, `eduprojecthub`, and one shared account model. The PHP APIs, React services, and SQL schemas all use the same IDs and status values.

## Import everything at once (new installation)

For a new/empty installation, use [`filetong/eduprojecthub-xampp.sql`](./filetong/eduprojecthub-xampp.sql). It combines the active core schemas, feature schemas, triggers, views, and demo data into one phpMyAdmin import.

1. In XAMPP Control Panel, start **MySQL**.
2. Open `http://localhost/phpmyadmin`.
3. Use **Import** from the phpMyAdmin home page (do not select an existing database first).
4. Choose `database\filetong\eduprojecthub-xampp.sql`, keep the format as **SQL**, and click **Import**.
5. After a successful import, the database `eduprojecthub` contains the demo data. Demo accounts `sv`, `truongnhom`, `gv`, `daotao`, and `admin` use password `123456`.

**Do not import this all-in-one file into a database that contains data.** The demo seed uses fixed IDs and is intended for a fresh demo database. Back up existing data and follow the existing-database instructions below instead.

The separate FR01 SQL draft is not imported as-is: it creates a different database, drops `users`, and defines role/status/session fields that conflict with this application's API. The combined package keeps the current demo accounts and adds compatible optional profile fields to `users`. `users.role` supports `admin`, `student`, `team_leader`, `lecturer`, and `training_manager`; account state uses `users.account_status`, and login sessions use PHP's session cookie. No unused `roles` or `user_sessions` tables are created.

## Fresh installation

Import in phpMyAdmin in this order:

1. `Tai_khoan.sql` — database and `users`.
2. `quan_ly_do_an.sql`
3. `quan_ly_nhom.sql`
4. `quan_ly_thanh_vien.sql`
5. `quan_ly_loi_moi.sql`
6. `quan_ly_yeu_cau.sql`
7. `phan_cong_giang_vien.sql`
8. `quan_ly_nhiem_vu.sql`
9. `kiem_tra_tien_do.sql`
10. `tao_view.sql`
11. `file examp.sql` — optional demo users, groups, assignments, and a task. Import once, after the core schema.
12. `bao_cao_do_an.sql`
13. `bao_ve_diem_so.sql`
14. `chatbot-faqs.sql`
15. Optional demo data: `examp bao_cao_do_an.sql`, `expam_bao_ve_diem_so.sql`, and `exam_chatbot-faqs.sql`.
16. `danh_sach_de_tai.sql` — topic/registration tables, notifications, FAQ audience scopes, leader integrity triggers, and notification triggers.

The demo accounts are `sv`, `truongnhom`, `gv`, `daotao`, and `admin`; each has password `123456`. The `truongnhom` account leads the demo group `N03`, and the demo lecturer is assigned two groups, as required by the API access policy. Change these passwords before exposing the site outside a local development machine.

The feature schemas use `student_groups`, `project_rounds`, and `users` from the core schema. Reports and defense schedules belong to a group; user/lecturer/student IDs always reference `users.id`. Semester/round data uses `project_rounds`. All scores use a 0–10 scale. FAQ visibility supports all five roles. The chat FAQ and history tables are created by `chatbot-faqs.sql`.

The `team_leader` account role inherits student capabilities. Whether an account is the leader of a particular group is still determined by `student_groups.leader_user_id` and `group_members.member_role`; the account role alone does not grant management rights over unrelated groups. The current backend gives `training_manager` access to existing round, topic, group-assignment, progress, report, and defense workflows. Account administration, system configuration, audit logs, backup/restore, and new semester create/update workflows are not currently implemented APIs.

The SQL files use `CREATE TABLE IF NOT EXISTS` and do not drop application data. The trigger and view scripts replace only their own triggers/views. Back up the database before applying schema changes to a database with existing data.

## Existing databases

`Tai_khoan.sql` does not alter a `users` table that already exists. For an older `eduprojecthub` database created before username login was added, back it up and run `upgrade-users-username.sql` once. It assigns temporary usernames `user<ID>`; update them to the intended login names afterward.

For an existing database, do not re-import `file examp.sql`. Back up first, run the username migration if required, then import any missing core table scripts and the three feature schemas. The `CREATE TABLE IF NOT EXISTS` scripts preserve existing rows; re-importing the trigger/view files only replaces those database objects.

For an existing database that already has `group_invitations`, back it up and run [`upgrade-group-invitation-code.sql`](./upgrade-group-invitation-code.sql) once to add and populate unique invitation codes. New databases already get this column from `quan_ly_loi_moi.sql`.

For an existing database, back it up and run [`upgrade-user-roles.sql`](./upgrade-user-roles.sql) once after `Tai_khoan.sql` and `chatbot-faqs.sql` are installed. Then rerun `kiem_tra_tien_do.sql` so the group-membership triggers accept both student account roles. The migrations expand the account-role and FAQ-visibility enums without changing existing role values.

For existing databases, first ensure the reports, defense schedules, tasks, and chatbot tables are installed, then back up and run [`danh_sach_de_tai.sql`](./danh_sach_de_tai.sql). It creates `project_topics`, `topic_registrations`, and `notifications`, adds FAQ visibility by role, repairs missing group-leader memberships, and installs leader-integrity and notification triggers. Newly created database packages already include these changes.

Do not import `xac_thuc.sql`: it is retired because its previous version created a second database, dropped `users`, and used a conflicting role/status schema. Do not import `file examp.sql` more than once.

## PHP connection

`database/database.php` is the single PDO connection used by every endpoint. XAMPP defaults are `DB_HOST=localhost`, `DB_NAME=eduprojecthub`, `DB_USER=root`, and an empty `DB_PASSWORD`. Override them with PHP environment variables when needed. Do not use the local root account in a deployed environment.

## API contract

The frontend uses camelCase models; PHP and MySQL use snake_case fields. `src/api/*Api.js` owns that mapping. API responses use `{ "data": ... }`; errors use `{ "error": "..." }`. Mutating requests use the PHP session cookie and `X-CSRF-Token`.

`POST groups.php?action=invite` returns the generated `invite_code`. `GET groups.php?action=sent_invitations` lists invitations for the signed-in student's own groups; administrators and training managers can list all sent invitations. Invitation codes are also included in the recipient's `GET groups.php?action=invitations` response.

Topics use `topics.php` actions `GET topics/registrations`, `POST create/register`, and `PATCH update/review`. Notifications use `notifications.php` actions `GET notifications` and `PATCH read/read_all`. `POST reports.php?action=feedback` lets an assigned lecturer submit report feedback; database triggers notify group members when feedback or defense schedules change. FAQ rows default to visibility `all`; set `visibility` to one of the five roles to restrict the audience. Team leaders can also view FAQs scoped to students.

| Feature | PHP endpoint | Actions |
|---|---|---|
| Authentication | `auth.php` | `POST login`, `GET me`, `POST logout` |
| Groups | `groups.php` | groups, group, create/update, member operations, requests, `GET invitations` (received), `GET sent_invitations` (leader/admin/training manager), lecturer assignment |
| Topics | `topics.php` | `GET topics/registrations`, `POST create/register`, `PATCH update/review` |
| Notifications | `notifications.php` | `GET notifications`, `PATCH read/read_all` |
| Tasks | `tasks.php` | tasks, task, create/update/status/delete |
| Progress | `progress.php` | group progress |
| Semester rounds | `semesters.php` | `GET semesters` |
| Reports and grades | `reports.php` | `GET reports`, `GET report`, `POST submit`, `GET grades` |
| Chatbot | `chatbot.php` | `GET faqs/sessions/messages`, `POST send` |

Report uploads accept PDF/DOC/DOCX up to 10 MB. Files are stored under `Code/Backend/storage/reports`, which denies direct Apache access; only metadata is returned by the API. Configure PHP's `file_uploads` and `upload_max_filesize` to permit files of the desired size.

## Authorization rules

- Every API request uses the signed-in user ID and current role from the database; the browser's cached user object is not an authorization source. Frontend route checks only control navigation and are not a replacement for API authorization.
- The supported account roles are `admin`, `student`, `team_leader`, `lecturer`, and `training_manager`. The frontend uses their uppercase equivalents.
- Admins and training managers can access the implemented cross-group and round-management workflows. Admin-only account management, role editing, system settings, audit/login history, backup, and restore APIs are not implemented.
- Students and team leaders can use student workflows. Access to a specific group still requires active membership or being that group's `leader_user_id`; only that group's leader can perform leader actions. A `team_leader` account role does not grant management rights over unrelated groups.
- Lecturers can access groups assigned to them only when assigned at least two groups. For those groups, they can create and edit tasks, provide report feedback, manage chatbot FAQs, and use the implemented topic workflows. They cannot cancel or delete tasks, change task status, or create/edit report rounds.
- Training managers coordinate existing round, topic, group-assignment, report, and defense workflows. The current semester-round API is read-only; round creation, editing, and closing are not implemented there.
- Students may access only their active groups. Only group leaders/admins can manage groups and tasks; assigned students can update their own task status.
- Lecturers can read assigned groups but cannot change group membership or group information.
- Admins can read all groups and manage permitted records.
- Students can submit reports only for groups they actively belong to. Users can read report/grade/chat records only within their authorized scope.
- Chatbot sessions and messages are private to the signed-in user.
- Chatbot FAQ answers are filtered by `chatbot_faqs.visibility` on both list and response matching.
