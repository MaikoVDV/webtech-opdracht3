Group 10
Maiko van der Veen - 8365121
Bessel Withoos - 4462327

http://webtech.science.uu.nl/group10/

Project structure:
/ -  the index.js and connect-database.js files, which handle the server and db initialization respectively
/api - All the API routes that the client interacts with
  account-management.js - Logging in and out
  chat.js - Getting conversations, chat messages and sending chat messages
  friends.js - Sending and replying to friend requests
  profile-management.js - Updating the data in a user's profile (very similar to registry but just as an UPDATE statement)
  users.js - Getting data on a given user (bio, photo, friends, courses, etc.)
/client - Static files served by express.static. The routes to HTML files are also defined manually with app.get statements in index.js for cleaner URLs, though the files also remain accessible through the default filepath.
  /scripts - All client-side JS files
    account-management.js - logging in and registering
    chat-manager.js - Getting conversations, chat messages and sending chat messages
    friend-requests.js - Displaying sent and received friend requests
    navbar.js - Adding the user's name to the right side of the navbar
    profile-modal.js - Configuring the profile modal and sending the updated data on form submission
      Editing profile pictures unfortunately does not work at this time due to an oversight on our part. We're aware of the problem, and we apologise for our error.
    profile.js - Handles filling the profile page with data and configuring the interactive features (like the course popup and friend-related buttons)
    register.js - Handles submission of the registry form
    utils.js - A little helper function elementBuilder() that makes dynamically adding HTML elmenents slightly more convenient.
  /stylesheets - Contain the stylesheets for all pages. Some stylesheets aren't specifically for a page, but for elements to general styling.
  *.html - Our html files.

Logging in:
Logging in to a user's account is done via their email and password.
All user's passwords are the same: bazinga
that's all lower-case, no spaces.



SQL database definitions:

CREATE TABLE IF NOT EXISTS Students (
id             INTEGER         PRIMARY KEY AUTOINCREMENT,
email          VARCHAR(255)    UNIQUE NOT NULL,
first_name     VARCHAR(32)     NOT NULL,
last_name      VARCHAR(32)     NOT NULL,
age            INTEGER,
photo          VARCHAR(255), --The ID of a given photo. References photos stored in /assets/profile_pics/[ID]
password	     CHAR(60),
hobbies        TEXT,
program        VARCHAR(100),
courses        TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_Students_email ON Students(email);

CREATE TABLE IF NOT EXISTS Friends (
first_id       INTEGER          NOT NULL,
second_id      INTEGER          NOT NULL,
date_added     TEXT             DEFAULT (CURRENT_DATE),
PRIMARY KEY (first_id, second_id) 
);

CREATE TABLE IF NOT EXISTS FriendRequests (
sender_id      INTEGER          NOT NULL,
target_id      INTEGER          NOT NULL,
status         VARCHAR(32)      DEFAULT 'pending',
PRIMARY KEY (sender_id, target_id),
FOREIGN KEY (sender_id) REFERENCES Students(id),
FOREIGN KEY (target_id) REFERENCES Students(id),
CHECK (status IN ('pending', 'accepted', 'rejected'))
);

CREATE TABLE IF NOT EXISTS Courses (
id                   INTEGER          PRIMARY KEY AUTOINCREMENT,
name                 VARCHAR(256)     NOT NULL,
description          TEXT,
teacher_first_name   VARCHAR(32)  NOT NULL,
teacher_last_name    VARCHAR(32)  NOT NULL
);

CREATE TABLE IF NOT EXISTS CourseParticipants (
course_id    INTEGER     NOT NULL,
student_id   INTEGER     NOT NULL, 
PRIMARY KEY (course_id, student_id)
);

CREATE TABLE IF NOT EXISTS Conversations (
id          INTEGER      PRIMARY KEY AUTOINCREMENT,
user1_id    INTEGER      NOT NULL,
user2_id    INTEGER      NOT NULL,
FOREIGN KEY (user1_id) REFERENCES Students(id),
FOREIGN KEY (user2_id) REFERENCES Students(id),
CONSTRAINT unique_conversation UNIQUE (user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS Messages (
id          INTEGER        PRIMARY KEY AUTOINCREMENT,
convo_id    INTEGER        NOT NULL,
sender_id   INTEGER        NOT NULL,
content     VARCHAR(1024)  NOT NULL,
sent_at     DATETIME       DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (convo_id) REFERENCES Conversations(id),
FOREIGN KEY (sender_id) REFERENCES Students(id)
);