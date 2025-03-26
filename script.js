const URL = "./my_model/";
let model, webcam, maxPredictions;
let labelContainerWebcam, labelContainerUpload;

// Carrega o modelo apenas uma vez
async function loadModel() {
  if (!model) {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
  }
}

// Inicia a Webcam em modo live
async function startWebcam() {
  await loadModel(); // Carrega o modelo (se ainda não carregado)

  // Define a webcam com flip horizontal
  const flip = true;
  webcam = new tmImage.Webcam(200, 200, flip);

  // Configura a webcam e inicia a exibição ao vivo
  await webcam.setup();
  await webcam.play();

  // Loop de atualização
  window.requestAnimationFrame(loop);

  // Limpa o container antes de adicionar o canvas
  document.getElementById("webcam-container").innerHTML = "";
  document.getElementById("webcam-container").appendChild(webcam.canvas);

  // Define o container de resultados da webcam
  labelContainerWebcam = document.getElementById("label-container-webcam");
}

// Loop que atualiza a imagem da webcam e faz a predição contínua
async function loop() {
  webcam.update();
  await predict(webcam.canvas, labelContainerWebcam);
  window.requestAnimationFrame(loop);
}

// Predição genérica para webcam ou imagem carregada
async function predict(imageElement, container) {
  const prediction = await model.predict(imageElement);

  // Limpa os resultados anteriores
  container.innerHTML = "";

  let bestMatch = { className: "", probability: 0 };

  // Exibe cada classe e probabilidade e encontra o time com maior probabilidade
  prediction.forEach(pred => {
    const div = document.createElement("div");
    div.innerText = `${pred.className}: ${pred.probability.toFixed(2)}`;
    container.appendChild(div);

    if (pred.probability > bestMatch.probability) {
      bestMatch = pred;
    }
  });

  // Altera o background com base no time detectado
  changeBackground(bestMatch.className);
}

// Função para alterar o background com base no time detectado
function changeBackground(team) {
  let colors = { background: "#000", text: "#fff" }; // Padrão (preto e branco)

  switch (team.toLowerCase()) {
    case "corinthians":
      colors = { background: "#000", text: "#fff" }; // Preto e branco
      break;
    case "cruzeiro":
      colors = { background: "#0046ae", text: "#fff" }; // Azul e branco
      break;
    case "flamengo":
      colors = { background: "#d30a0a", text: "#000" }; // Vermelho e preto
      break;
    case "internacional":
      colors = { background: "#ffffff", text: "#d30a0a" }; // Branco e vermelho
      break;
  }

  // Aplica as cores no body
  document.body.style.backgroundColor = colors.background;
  document.body.style.color = colors.text;
}

// Evento para Upload de Imagem
document.getElementById("imageUpload").addEventListener("change", async function(event) {
  await loadModel(); // Carrega o modelo (se ainda não carregado)

  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = document.getElementById("uploadedImage");
      img.src = e.target.result; // Mostra a imagem
      img.onload = async function() {
        // Define o container de resultados do upload
        labelContainerUpload = document.getElementById("label-container-upload");
        await predict(img, labelContainerUpload);
      };
    };
    reader.readAsDataURL(file);
  }
});
