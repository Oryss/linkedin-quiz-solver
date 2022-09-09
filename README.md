# LinkedIn Quiz Solver

Adds a button to view the answer in LinkedIn skill assessments.

It uses [Ebazhanov/linkedin-skill-assessments-quizzes](https://github.com/Ebazhanov/linkedin-skill-assessments-quizzes) as a source for answers.

[linkedinquiz.webm](https://user-images.githubusercontent.com/43440732/189339127-7f71fb65-de4e-4f2d-bf0e-473aeb283e15.webm)

# Installation

- [Download the latest release](https://github.com/Oryss/linkedin-quiz-solver/releases), unzip it anywhere
- Go to [chrome://extensions/](chrome://extensions/) and activate developer mode
- Click "Install unpacked extension" and select the `LinkedInQuizSolver` folder

# Usage

- Set LinkedIn language to english for better results
- Start any quiz
- Reload the page when you're on a question's page, the "View answer" button should appear

# Limitations

- It does not work with questions/answers based on images
- The question language is based on LinkedIn's current language so if you're doing an english quiz when using the italian interface, it won't work well
- As it's parsing markdown, it can be buggy while matching questions/answers
