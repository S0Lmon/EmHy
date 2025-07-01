// Lấy các tham chiếu đến phần tử DOM
const timeLeft = document.querySelector(".time-left");
const quizContainer = document.getElementById("container");
const nextBtn = document.getElementById("next-button");
const countOfQuestion = document.querySelector(".number-of-question");
const displayContainer = document.getElementById("display-container");
const scoreContainer = document.querySelector(".score-container");
const restart = document.getElementById("restart");
const userScore = document.getElementById("user-score");
const startScreen = document.querySelector(".start-screen");
const startButton = document.getElementById("start-button");
const explanationContainer = document.getElementById("explanation-container");
const explanationText = document.getElementById("explanation-text");
const vocabularySection = document.getElementById('vocabulary-section');
const vocabularyList = document.getElementById('vocabulary-list');
const quitBtn = document.getElementById("quit-btn");
const incorrectAnswersList = document.getElementById("incorrect-answers-list");
const incorrectAnswersSection = document.getElementById("incorrect-answers-section");

let questionCount;
let scoreCount = 0;
let count = 72; // Giả sử thời gian trung bình cho mỗi câu
let countdown;
let quizArray = [];
let quizVocabulary = new Map();
let incorrectAnswers = [];

// Tải câu hỏi từ file JSON
async function loadQuestions() {
    try {
        // SỬA LỖI: Đường dẫn đến file JSON.
        // Giả sử bạn đặt file questions.json trong thư mục gốc cùng với index.html
        // Nếu bạn đặt nó trong thư mục con, ví dụ "data", hãy đổi thành './data/questions.json'
        const response = await fetch('./questions.json'); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Chuyển đổi dữ liệu để phù hợp với template
        quizArray = data.map(item => {
            const correctText = item.Options[item.CorrectAnswer];
            return {
                id: item.Id.toString(),
                question: item.Question,
                options: item.Options,
                correct: correctText,
                explanation: item.Explanation,
                vocabulary: item.Vocabulary || []
            };
        });
    } catch (e) {
        console.error("Could not load quiz data:", e);
        alert("Không thể tải dữ liệu câu hỏi. Vui lòng kiểm tra lại file questions.json!");
    }
}

// Hàm khởi tạo/bắt đầu lại bài thi
const initial = () => {
    // Ẩn các màn hình không cần thiết và hiện màn hình thi
    displayContainer.classList.remove("hide");
    scoreContainer.classList.add("hide");

    quizContainer.innerHTML = "";
    questionCount = 0;
    scoreCount = 0;
    quizVocabulary.clear();
    incorrectAnswers = [];
    
    // Xáo trộn câu hỏi
    quizArray.sort(() => Math.random() - 0.5);

    // Giới hạn 50 câu hỏi cho mỗi bài thi (nếu cần)
    if (quizArray.length > 50) {
        quizArray = quizArray.slice(0, 50);
    }
    
    // Tạo các thẻ câu hỏi
    quizCreator();
    
    // Hiển thị câu hỏi đầu tiên
    quizDisplay(questionCount);
    
    // Bắt đầu đếm giờ
    count = 72; // Reset thời gian cho mỗi câu
    clearInterval(countdown);
    timerDisplay();
};

// Hàm tạo các thẻ câu hỏi và giấu đi
function quizCreator() {
    // Sửa lỗi: Clear container trước khi tạo mới để tránh trùng lặp khi restart
    quizContainer.innerHTML = "";
    for (let i of quizArray) {
        i.options.sort(() => Math.random() - 0.5);
        let div = document.createElement("div");
        div.classList.add("container-mid", "hide");
        
        let question_DIV = document.createElement("p");
        question_DIV.classList.add("question");
        question_DIV.innerHTML = i.question;
        div.appendChild(question_DIV);
        
        div.innerHTML += `
            <button class="option-div" onclick="checker(this)">${i.options[0]}</button>
            <button class="option-div" onclick="checker(this)">${i.options[1]}</button>
            <button class="option-div" onclick="checker(this)">${i.options[2]}</button>
            <button class="option-div" onclick="checker(this)">${i.options[3]}</button>
        `;
        quizContainer.appendChild(div);
    }
}

// Hàm hiển thị câu hỏi hiện tại
const quizDisplay = (questionCount) => {
    let quizCards = document.querySelectorAll(".container-mid");
    quizCards.forEach((card) => {
        card.classList.add("hide");
    });
    if(quizCards[questionCount]) {
        quizCards[questionCount].classList.remove("hide");
    }
    
    countOfQuestion.innerHTML = (questionCount + 1) + " of " + quizArray.length + " Question";

    const currentQuestionData = quizArray[questionCount];
    if (currentQuestionData && currentQuestionData.vocabulary.length > 0) {
        currentQuestionData.vocabulary.forEach(vocab => {
            if (!quizVocabulary.has(vocab.Term)) {
                quizVocabulary.set(vocab.Term, vocab.Definition);
            }
        });
    }

    explanationContainer.classList.add("hide");
};

// Hàm kiểm tra đáp án
function checker(userOption) {
    let userSolution = userOption.innerText;
    let question = document.getElementsByClassName("container-mid")[questionCount];
    let options = question.querySelectorAll(".option-div");

    clearInterval(countdown);
    options.forEach((element) => {
        element.disabled = true;
    });

    if (userSolution === quizArray[questionCount].correct) {
        userOption.classList.add("correct");
        scoreCount++;
    } else {
        userOption.classList.add("incorrect");
        options.forEach((element) => {
            if (element.innerText == quizArray[questionCount].correct) {
                element.classList.add("correct");
            }
        });
        incorrectAnswers.push({
            question: quizArray[questionCount].question,
            correctAnswer: quizArray[questionCount].correct,
            explanation: quizArray[questionCount].explanation,
            vocabulary: quizArray[questionCount].vocabulary
        });
    }

    explanationText.innerHTML = `<b>Giải thích:</b> ${quizArray[questionCount].explanation}`;
    explanationContainer.classList.remove("hide");
}

// Hàm hiển thị kết quả cuối cùng
function displayResults() {
    displayContainer.classList.add("hide");
    scoreContainer.classList.remove("hide");
    userScore.innerHTML = "Điểm của bạn là " + scoreCount + " trên " + quizArray.length;
    displayVocabulary();
    displayIncorrectAnswers();
}

// Hàm hiển thị các câu trả lời sai
function displayIncorrectAnswers() {
    incorrectAnswersList.innerHTML = "";
    if (incorrectAnswers.length > 0) {
        incorrectAnswers.forEach(item => {
            const itemElement = document.createElement("div");
            itemElement.classList.add("incorrect-answer-item");
            let keywords = "";
            if(item.vocabulary && item.vocabulary.length > 0) {
                keywords = item.vocabulary.map(v => v.Term).join(", ");
            }
            itemElement.innerHTML = `
                <p><strong>Question:</strong> ${item.question}</p>
                <p><strong>Correct Answer:</strong> ${item.correctAnswer}</p>
            `;
            incorrectAnswersList.appendChild(itemElement);
        });
        incorrectAnswersSection.classList.remove("hide");
    } else {
        incorrectAnswersSection.classList.add("hide");
    }
}


// Hàm hiển thị danh sách từ vựng
function displayVocabulary() {
    vocabularyList.innerHTML = '';
    if (quizVocabulary.size > 0) {
        const sortedVocabulary = new Map([...quizVocabulary.entries()].sort());
        sortedVocabulary.forEach((definition, term) => {
            const item = document.createElement('div');
            item.classList.add('vocab-item');
            item.innerHTML = `<strong>${term}:</strong> ${definition}`;
            vocabularyList.appendChild(item);
        });
        vocabularySection.classList.remove('hide');
    } else {
        vocabularySection.classList.add('hide');
    }
}

// Hàm đếm giờ
const timerDisplay = () => {
    countdown = setInterval(() => {
        count--;
        timeLeft.innerHTML = `${count}s`;
        if (count == 0) {
            clearInterval(countdown);
            // Tự động xử lý như một câu trả lời sai nếu hết giờ
            let question = document.getElementsByClassName("container-mid")[questionCount];
            let options = question.querySelectorAll(".option-div");
            checker(document.createElement("button")); // Gửi một nút rỗng để tính là sai
            setTimeout(displayNext, 2000); // Chờ 2 giây rồi chuyển câu
        }
    }, 1000);
};

// Hàm xử lý khi nhấn nút "Next"
const displayNext = () => {
    // Chỉ tăng câu hỏi nếu chưa phải câu cuối
    if (questionCount < quizArray.length - 1) {
        questionCount += 1;
        quizDisplay(questionCount);
        count = 72;
        clearInterval(countdown);
        timerDisplay();
    } else {
        // Nếu là câu cuối, hiển thị kết quả
        displayResults();
    }
};

// Gắn các sự kiện
nextBtn.addEventListener("click", () => {
    // Chỉ cho phép nhấn Next sau khi đã chọn đáp án
    let question = document.getElementsByClassName("container-mid")[questionCount];
    if (question.querySelector(".option-div:disabled")) {
        displayNext();
    } else {
        alert("Vui lòng chọn một đáp án!");
    }
});

restart.addEventListener("click", () => {
    // Không cần load lại câu hỏi nếu đã có sẵn
    if(quizArray.length > 0) {
        initial();
    } else {
        // Dành cho trường hợp tải lần đầu thất bại
        startButton.click();
    }
});

startButton.addEventListener("click", async () => {
    await loadQuestions();
    if (quizArray.length > 0) {
        startScreen.classList.add("hide");
        initial();
    }
});

quitBtn.addEventListener("click", () => {
    clearInterval(countdown);
    displayContainer.classList.add("hide");
    scoreContainer.classList.add("hide");
    startScreen.classList.remove("hide");
});

// Thiết lập màn hình ban đầu khi tải trang
window.onload = () => {
    startScreen.classList.remove("hide");
    displayContainer.classList.add("hide");
    scoreContainer.classList.add("hide");
};