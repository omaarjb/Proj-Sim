// Cette fonction récupère les valeurs saisies par l'utilisateur pour définir le nombre de variables et de contraintes
function get_input() {
  // Récupérer le nombre de variables à partir de l'élément HTML
  let num_vars = parseInt(document.getElementById("num-vars").value);
  // Afficher la section pour entrer la fonction objectif
  let objectiveInputs = document.getElementById("objective-inputs");
  objectiveInputs.innerHTML =
    "<div class='objective-container border p-3 rounded'><h4 class='title'>La fonction objectif max(Z)</h4></div>";

  let container = objectiveInputs.querySelector(".objective-container");

  // Ajouter des éléments d'entrée pour chaque coefficient de la fonction objectif
  for (let i = 0; i < num_vars; i++) {
    let inputGroup = document.createElement("div");
    inputGroup.classList.add("input-group");
    inputGroup.innerHTML = `
        <label for="var-x${i + 1}" class="mr-2">Coefficient pour x${
      i + 1
    }:</label>
        <input type="number" id="var-x${i + 1}" class="form-control" required>
    `;
    container.appendChild(inputGroup);
  }
  objectiveInputs.innerHTML += "<br>";

  // Récupérer le nombre de contraintes à partir de l'élément HTML
  let num_constraints = parseInt(
    document.getElementById("num-constraints").value
  );
  let constraintInputs = document.getElementById("constraint-inputs");
  constraintInputs.innerHTML = "";

  // Créer un conteneur avec des bordures Bootstrap pour les entrées des contraintes
  let containerDiv = document.createElement("div");
  containerDiv.classList.add("border", "p-3", "rounded");

  // Ajouter des entrées pour chaque contrainte
  for (let i = 0; i < num_constraints; i++) {
    let constraintRow = document.createElement("div");
    constraintRow.classList.add("input-group");
    let rowHtml = `
      <label for="constraint-${i + 1}" class="mr-2">Contrainte ${i + 1}:</label>
  `;
    for (let j = 0; j < num_vars; j++) {
      rowHtml += `
          <input type="number" id="constraint-${i + 1}-x${
        j + 1
      }" class="form-control mr-2" placeholder="Coefficient pour x${
        j + 1
      }" required>
      `;
      if (j < num_vars - 1) {
        rowHtml += `
          <span>  + </span>
      `;
      }
    }
    rowHtml += `
  <span> <= </span>
        <input type="number" id="constraint-${
          i + 1
        }-rhs" class="form-control mr-2" placeholder="Constante" required>
        
    `;
    constraintRow.innerHTML = rowHtml;
    containerDiv.appendChild(constraintRow);
  }

  constraintInputs.appendChild(containerDiv);
}

// Cette fonction implémente l'algorithme simplex pour résoudre le problème d'optimisation linéaire
function simplex(c, A, b) {
  // Préparer le tableau initial du simplexe
  A.forEach((row) => row.push(...Array(A.length).fill(0)));
  c.push(...Array(A.length).fill(0));

  let tableau = A.map((row, index) =>
    index < b.length ? [...row, b[index]] : row
  );
  tableau.push([...c, 0]);

  let basic_variables = Array.from(
    { length: A.length },
    (_, i) => i + A[0].length
  );

  let iteration = 1;
  let num_vars = c.length;

  while (true) {
    if (
      tableau[tableau.length - 1].slice(0, -1).every((element) => element <= 0)
    ) {
      break;
    }

    // Sélectionner la colonne pivot
    let pivot_column = tableau[tableau.length - 1]
      .slice(0, -1)
      .indexOf(Math.max(...tableau[tableau.length - 1].slice(0, -1)));

    // Calculer les rapports pour sélectionner la ligne pivot
    let ratios = tableau
      .slice(0, -1)
      .map((row) => row[row.length - 1] / row[pivot_column]);
    ratios = ratios.map((value, index) => (value < 0 ? Infinity : value));
    let pivot_row = ratios.indexOf(Math.min(...ratios));

    // Vérifier si l'optimisation est impossible
    if (ratios[pivot_row] === Infinity) {
      return [null, null];
    }

    // Mettre à jour les variables de base et effectuer les opérations du simplexe
    basic_variables[pivot_row] = pivot_column;

    let pivot_value = tableau[pivot_row][pivot_column];
    tableau[pivot_row] = tableau[pivot_row].map((value) => value / pivot_value);
    tableau.forEach((row, index) => {
      if (index !== pivot_row) {
        tableau[index] = row.map(
          (value, col) => value - row[pivot_column] * tableau[pivot_row][col]
        );
      }
    });

    iteration++;
  }

  // Récupérer la solution optimale et la valeur optimale
  let optimal_solution = Array.from({ length: c.length }, () => 0);
  let slack_variables = [];

  basic_variables.forEach((col, index) => {
    if (col < c.length) {
      optimal_solution[col] = tableau[index][tableau[0].length - 1];
    } else {
      slack_variables.push(tableau[index][tableau[0].length - 1]);
    }
  });

  let optimal_value = -tableau[tableau.length - 1][tableau[0].length - 1];
  return [optimal_solution, optimal_value, slack_variables];
}

// Cette fonction est appelée lorsqu'un utilisateur clique sur le bouton "Résoudre"
function solve() {
  // Récupérer les coefficients de la fonction objectif et les contraintes saisies par l'utilisateur
  let num_vars = parseInt(document.getElementById("num-vars").value);
  let c = [];
  for (let i = 0; i < num_vars; i++) {
    let value = parseFloat(document.getElementById(`var-x${i + 1}`).value);
    if (isNaN(value)) {
      alert(
        "Please fill in all coefficient fields for the objective function."
      );
      return;
    }
    c.push(value);
  }

  let num_constraints = parseInt(
    document.getElementById("num-constraints").value
  );
  let A = [];
  let b = [];
  for (let i = 0; i < num_constraints; i++) {
    let constraintRow = [];
    for (let j = 0; j < num_vars; j++) {
      let value = parseFloat(
        document.getElementById(`constraint-${i + 1}-x${j + 1}`).value
      );
      if (isNaN(value)) {
        alert(`Please fill in all coefficient fields for constraint ${i + 1}.`);
        return;
      }
      constraintRow.push(value);
    }
    A.push(constraintRow);
    let rhs = parseFloat(
      document.getElementById(`constraint-${i + 1}-rhs`).value
    );
    if (isNaN(rhs)) {
      alert(`Please fill in the constant value for constraint ${i + 1}.`);
      return;
    }
    b.push(rhs);
  }

  // Appeler la fonction simplex pour résoudre le problème
  let [variables, obj, slackVariables] = simplex(c, A, b);
  let output = document.getElementById("output");

  // Afficher la solution ou un message d'erreur si l'optimisation est impossible
  if (variables === null && obj === null) {
    output.innerHTML = `<div class="alert alert-danger" role="alert">Optimization is not possible!</div>`;
    return;
  }

  // Générer le HTML pour afficher la solution
  let variablesHtml = "";
  for (let i = 0; i < num_vars; i++) {
    // Pour chaque variable dans la solution optimale
    if (variables[i] !== 0) {
      // Vérifier si la variable est une variable de base ou non
      // Si la variable est une variable de base, l'ajouter à la sortie avec sa valeur et la catégorie VB (Variable de Base)
      variablesHtml += `<tr class="base-variable"><th scope="row">x${
        i + 1
      }</th><td>${variables[i]}</td><td class="variable-category">VB</td></tr>`;
    } else {
      // Sinon, l'ajouter à la sortie avec sa valeur et la catégorie VHB (Variable Hors Base)
      variablesHtml += `<tr class="non-base-variable"><th scope="row">x${
        i + 1
      }</th><td>${
        variables[i]
      }</td><td class="variable-category">VHB</td></tr>`;
    }
  }

  // Générer le HTML pour afficher les variables d'écart
  let slackVariablesHtml = "";
  for (let i = 0; i < num_constraints; i++) {
    let slackVar = i < slackVariables.length ? slackVariables[i] : 0;
    if (slackVar !== 0) {
      slackVariablesHtml += `<tr class="base-variable"><th scope="row">e${
        i + 1
      }</th><td>${slackVar}</td><td class="variable-category">VB</td></tr>`;
    } else {
      slackVariablesHtml += `<tr class="non-base-variable"><th scope="row">e${
        i + 1
      }</th><td>${slackVar}</td><td class="variable-category">VHB</td></tr>`;
    }
  }

  // Afficher la solution dans le HTML
  output.innerHTML = `<br><br>
        <div class="table-container">
            <h2 class="text-center mb-3 title">Solution optimale</h2>
            <table class="table table-bordered">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col">Variable</th>
                        <th scope="col">Valeur</th>
                        <th scope="col">Catégorie</th>
                    </tr>
                </thead>
                <tbody>
                    ${variablesHtml}
                    ${slackVariablesHtml}
                    <tr class="red-row"> 
                        <th scope="row">Z : la valeur objectif</th>
                        <td>${obj}</td>
                        <td>N/A</td>
                    </tr>
                </tbody>
            </table>
            <br>
        </div>
    `;
}

// Écouter les changements sur le nombre de variables et de contraintes pour mettre à jour les entrées
document.getElementById("num-vars").addEventListener("change", get_input);
document
  .getElementById("num-constraints")
  .addEventListener("change", get_input);
