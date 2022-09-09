import Fuse from 'fuse.js';
import { marked } from 'marked';

const b64_to_utf8 = (str) => decodeURIComponent(escape(window.atob(str)));

(async () => {
  const quizTitle = document.querySelector(".sa-assessment-quiz h1");
  if (!quizTitle) {
    return;
  }
    
  // Fetch all files in the answer repository
  const response = await fetch("https://api.github.com/repos/Ebazhanov/linkedin-skill-assessments-quizzes/git/trees/main");
  const rootFiles = await response.json();

  // Get all directories, which indicates different quizzes
  let rootOptions = rootFiles.tree
  .filter(file => file.type === "tree" && !file.path.startsWith('.') && !file.path.endsWith('.md'))
  .map(file => {
    let label = file.path.charAt(0).toUpperCase() + file.path.slice(1);
    label = label.replaceAll('-', ' ');
  
    return ({ path: file.path, label, url: file.url });
  });
 
  // Find quiz by fuzzy searching title in all folders
  const fuse = new Fuse(rootOptions, {
    keys: ['label'],
    includeScore: true,
  });
  const cleanTitle = quizTitle.innerText.replace("assessment", "");
  const matchingQuizzes = fuse.search(cleanTitle);

  const matchingOption = matchingQuizzes[0] ?? null;
  if (!matchingOption) {
    throw new Error(`No matching quiz found for title ${cleanTitle}`);
  }

  // Quiz is found, now fetch the available languages
  const optionResponse = await fetch(matchingOption.item.url);
  const files = await optionResponse.json();

  let filesOptions = files.tree
  .filter(file => file.type === "blob" && file.path.endsWith('.md'))
  .map(file => {
    let lang = file.path.slice(file.path.lastIndexOf("-") + 1, file.path.indexOf(".md"));
    if (lang === "quiz") {
      lang = "en";
    }

    return ({ path: file.path, lang, url: file.url });
  });

  // Get current language from html lang tag (en, fr, es)
  const currentLanguage = document.querySelector('html.theme').getAttribute('lang');

  const optionMatchingLanguage = filesOptions.find(option => option.lang === currentLanguage);

  const markdownResponse = await fetch(optionMatchingLanguage.url);
  const jsonResponse = await markdownResponse.json();

  const responseMd = b64_to_utf8(jsonResponse.content);
  const tokens = marked.lexer(responseMd);
  const filteredTokens = tokens.filter(token => token.type === "heading" || token.type === "list");

  let answers = [];
  let currentAnswerIndex = -1;
  filteredTokens.forEach((token, i) => {
    const isQuestionRegex = /#{2,4}\s.*/i;

    // If it's a question, create the object
    if (token.raw.match(isQuestionRegex)) {
      currentAnswerIndex++;
      answers[currentAnswerIndex] = { 
        question: token.text,
        choices: []
      };
    } else { // It's not a question so it's a possible answer, add it to the choices array
      answers[currentAnswerIndex] = {
        ...answers[currentAnswerIndex],
        choices: [
          ...answers[currentAnswerIndex].choices,
          ...token.items
        ]
      };
    }
  });

  const onDisplayAnswerButtonClick = () => {
    const fuse = new Fuse(answers, {
      keys: ['question'],
      includeScore: true,
    });

    const question = document.querySelector('#assessment-a11y-title');
    if (!question) {
      alert('Cannot find question in page content');
      throw new Error('Cannot find question');
    }

    const matchingAnswers = fuse.search(question.innerText);
    if (!matchingAnswers || matchingAnswers[0].length === 0) {
      alert('Could not find answer for this question');
      throw new Error('Cannot find answer');
    }

    const matchingAnswer = matchingAnswers[0].item;
    const choiceToMake = matchingAnswer.choices.find(choice => choice.checked);

    if (!choiceToMake) {
      alert('Answer not found in database');
      throw new Error('Answer not found in repository');
    }

    const possibleAnswers = document.querySelectorAll('.sa-assessment-quiz__response li.sa-question-multichoice__item span.visually-hidden');
    const answersWithIndex = Array.prototype.map.call(possibleAnswers, (answer, index) => ({
        answer: answer.innerText,
        index
    }));

    const answerToSelectFuse = new Fuse(answersWithIndex, {
      keys: ['answer'],
      includeScore: true,
    });
    const answersToSelect = answerToSelectFuse.search(choiceToMake.text);
    if (answersToSelect.length === 0) {
      throw new Error('Could not find choice to select');
    }

    const answerToSelectIndex = answersToSelect[0].item.index;
    const answerToSelect = document.querySelector(`.sa-assessment-quiz__response li.sa-question-multichoice__item:nth-child(${answerToSelectIndex + 1})`);
    if (!answerToSelect) {
      throw new Error('Could not find answer in list by its index');
    }

    answerToSelect.style.backgroundColor = "var(--color-background-new)";
  }

  // Add the button to highlight answer
  const footer = document.querySelector(".sa-assessment-quiz__footer .display-flex .display-flex");
  const displayAnswerButton = document.createElement('button');
  displayAnswerButton.classList.add("sa-assessment-quiz__primary-action", "artdeco-button", "artdeco-button--2", "artdeco-button--premium", "ember-view");
  displayAnswerButton.innerText = "Show answer";
  displayAnswerButton.addEventListener("click", onDisplayAnswerButtonClick);
  footer.appendChild(displayAnswerButton);
  footer.parentNode.insertBefore(displayAnswerButton, footer.nextSibling);
})();