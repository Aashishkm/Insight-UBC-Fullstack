---
name: User Stories
about: Use this template for user stories submission
title: "C3 Phase 1: User Stories"
labels: []
assignees: ""
---

## Frontend Selection
In two to three sentences, give a description on the frontend you are to build. Is it going to be a Web frontend? A Discord bot? What external packages, libraries, or frameworks would you need?

Do this **before** you go on to writing your user stores!

Our frontend will be built using a Discord bot that will most likely use the discord.js library. 

## User Stories + DoDs  
Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for the Definitions of Done! For the DoDs, think about both success and failure scenarios. You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-22w2/project/checkpoint-3).

### User Story 1

As a student, I want to check the overall average of past sections for a certain course, so that I can estimate the difficulty of a course.

#### Definitions of Done(s)

Scenario 1: Valid course
Given: The student is on a channel that the bot is listening on.
When: The student inputs a prefixed command specifying a valid course (e.g. !average CPSC 310).
Then: The bot prints the historical overall average for that course in the same text channel that the command was called in.

Scenario 2: Invalid course
Given: The student is on a channel that the bot is listening on.
When: The student inputs a prefixed command specifying an invalid course (e.g. !average ABCD 999).
Then: The bot will print a message in the same text channel that the command was called in saying it could not find the specified course.

### User Story 2

As an Instructor/Department Head, I want to be able to remove datasets with outdated course information (ex. courses that don't exist anymore), so that students have the most up to date course insight information.

#### Definitions of Done(s)

Scenario 1: Valid Dataset
Given: The instructor is on a channel that the bot is listening on
When: The instructor inputs a prefixed command that specifies a valid dataset
Then: The bot will remove the dataset specified from the database

Scenario 2: Invalid Dataset
Given: The instructor is on a channel that the bot is listening on
When: The instructor inputs a prefixed command that specifies a certain invalid dataset
Then: The bot will print a message in the same text channel saying that it could not find the specified dataset, and that the removal was unsuccessful

### Others

You may provide any additional user stories + DoDs in this section for general TA feedback.

But these will not be graded.
