import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBj0aVf0W9sq5w9qa4_NvaOplA5zJny2NM",
  authDomain: "barmyforce-site.firebaseapp.com",
  projectId: "barmyforce-site",
  storageBucket: "barmyforce-site.firebasestorage.app",
  messagingSenderId: "36118198240",
  appId: "1:36118198240:web:6f347ceb9cde0830459d85",
  measurementId: "G-KGSP7S83JN"
};

const app = initializeApp(firebaseConfig);
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const perguntas = [
  { pergunta: "Qual foi a data do show do BTS no Brasil em 2019?", opcoes: ["24 e 25 de maio", "10 e 11 de junho", "15 e 16 de abril", "1 e 2 de julho"], resposta: "24 e 25 de maio" },
  { pergunta: "Em qual cidade brasileira o BTS se apresentou em 2019?", opcoes: ["Rio de Janeiro", "São Paulo", "Recife", "Brasília"], resposta: "São Paulo" },
  { pergunta: "Qual era o nome da turnê do BTS que passou pelo Brasil em 2019?", opcoes: ["Wings Tour", "Love Yourself: Speak Yourself", "Map of The Soul Tour", "Yet To Come"], resposta: "Love Yourself: Speak Yourself" },
  { pergunta: "Qual membro lançou o álbum Layover?", opcoes: ["Taehyung", "Jungkook", "Jimin", "Namjoon"], resposta: "Taehyung" },
  { pergunta: "Qual música costuma aparecer em projetos emocionais?", opcoes: ["Mikrokosmos", "Butter", "Dynamite", "Idol"], resposta: "Mikrokosmos" },
  { pergunta: "Qual fandom usa o termo ARMY BR?", opcoes: ["Fãs brasileiros do BTS", "Fãs americanos", "Fãs japoneses", "Fãs coreanos"], resposta: "Fãs brasileiros do BTS" }
];

let perguntasSorteadas = [];
let tempo = 30;
let intervalo;

// --- EXPORTANDO AS FUNÇÕES PARA O HTML (A SOLUÇÃO DOS BOTÕES!) ---

window.mostrar = function(id) {
  const secoes = ["loginArea", "areaVerificacao", "areaProjetos", "mensagemNegada"];
  secoes.forEach(secao => {
    const elemento = document.getElementById(secao);
    if (elemento) elemento.style.display = "none";
  });
  
  const papelSecao = document.querySelector(".papel-secao");
  if (papelSecao) papelSecao.style.display = "none";

  const secaoDesejada = document.getElementById(id);
  if (secaoDesejada) secaoDesejada.style.display = "block";
  
  if (id === "loginArea" && papelSecao) {
    papelSecao.style.display = "grid"; 
  }
};

window.loginGoogle = async function () {
  try {
    await signInWithPopup(auth, provider);
    iniciarVerificacao();
  } catch (erro) {
    console.error("Erro no login:", erro);
    negarAcesso("Erro ao fazer login com Google.");
  }
};

window.verificarRespostas = function () {
  clearInterval(intervalo);
  let acertos = 0;
  perguntasSorteadas.forEach((item, index) => {
    const marcada = document.querySelector(`input[name="p${index}"]:checked`);
    if (marcada && marcada.value === item.resposta) {
      acertos++;
    }
  });

  if (acertos === 2) {
    window.mostrar("areaProjetos");
  } else {
    negarAcesso("Respostas incorretas. Tente novamente mais tarde.");
  }
};

window.sair = async function () {
  try {
    await signOut(auth);
  } catch (erro) {
    console.warn("Erro ao sair:", erro);
  }
  location.reload();
};

window.abrirProjetos = function () {
  iniciarVerificacao();
};


// --- FUNÇÕES INTERNAS DE LÓGICA ---

async function iniciarVerificacao() {
  if (!auth.currentUser) {
    alert("Por favor, faça login primeiro para acessar os projetos.");
    window.mostrar("loginArea");
    return;
  }
  window.mostrar("areaVerificacao");
  document.getElementById("statusVerificacao").innerText = "Verificando localização...";
  
  const acessoBrasil = await verificarBrasil();
  if (!acessoBrasil) {
    negarAcesso("Acesso permitido apenas para usuários localizados no Brasil.");
    return;
  }
  
  document.getElementById("statusVerificacao").innerText = "Localização confirmada. Responda às perguntas abaixo.";
  sortearPerguntas();
  iniciarTimer();
}

async function verificarBrasil() {
  try {
    const resposta = await fetch("https://ipapi.co/json/");
    const dados = await resposta.json();
    return dados.country_code === "BR";
  } catch (erro) {
    console.warn("API de IP falhou. Liberando acesso em modo de teste.");
    return true;
  }
}

function sortearPerguntas() {
  const embaralhadas = [...perguntas].sort(() => Math.random() - 0.5);
  perguntasSorteadas = embaralhadas.slice(0, 2);
  let html = "";
  
  perguntasSorteadas.forEach((item, index) => {
    const opcoesEmbaralhadas = [...item.opcoes].sort(() => Math.random() - 0.5);
    html += `
      <div class="pergunta-card">
        <h3>${index + 1}</h3>
        <p>${item.pergunta}</p>
        ${opcoesEmbaralhadas.map(opcao => `
          <label class="opcao">
            <input type="radio" name="p${index}" value="${opcao}">
            ${opcao}
          </label>
        `).join("")}
      </div>
    `;
  });
  document.getElementById("formPerguntas").innerHTML = html;
}

function iniciarTimer() {
  tempo = 30;
  document.getElementById("tempo").innerText = String(tempo).padStart(2, "0");
  clearInterval(intervalo);
  
  intervalo = setInterval(() => {
    tempo--;
    document.getElementById("tempo").innerText = String(tempo).padStart(2, "0");
    if (tempo <= 0) {
      clearInterval(intervalo);
      negarAcesso("O tempo esgotou! Você não respondeu rápido o suficiente.");
    }
  }, 1000);
}

function negarAcesso(motivo) {
  clearInterval(intervalo);
  const elMotivo = document.getElementById("motivoNegado");
  if (elMotivo) elMotivo.innerText = motivo;
  window.mostrar("mensagemNegada");
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.mostrar("loginArea");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const linksMenu = document.querySelectorAll(".menu nav a");
  
  if (linksMenu[0]) {
    linksMenu[0].addEventListener("click", (event) => {
      event.preventDefault(); 
      window.mostrar("loginArea");
    });
  }
  
  if (linksMenu[1]) {
    linksMenu[1].addEventListener("click", (event) => {
      event.preventDefault(); 
      iniciarVerificacao(); 
    });
  }
});

window.enviarProjeto = async function(){

try{

await addDoc(
collection(db,"projetos"),
{

nome:
document.getElementById("nomeProjeto").value,

responsavel:
document.getElementById("responsavelProjeto").value,

email:
document.getElementById("emailProjeto").value,

objetivo:
document.getElementById("objetivoProjeto").value,

explicacao:
document.getElementById("explicacaoProjeto").value,

funcionamento:
document.getElementById("funcionamentoProjeto").value,

recursos:
document.getElementById("recursosProjeto").value,

publico:
document.getElementById("publicoProjeto").value,

impacto:
document.getElementById("impactoProjeto").value,

documento:
document.getElementById("documentoProjeto").value,

data:new Date()

});

alert("Projeto enviado para análise 💜");

}
catch(erro){

console.log(erro);

alert("Erro ao enviar projeto");

}

}