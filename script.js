function get_input() {
  let num_vars = parseInt(document.getElementById("num-vars").value);
  let objectiveInputs = document.getElementById("objective-inputs");
  objectiveInputs.innerHTML =
    "<div class='objective-container border p-3 rounded'><h4 class='title'>La fonction objectif max(Z)</h4></div>";

  let container = objectiveInputs.querySelector(".objective-container");

  // Add <br> tag after the border

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

  let num_constraints = parseInt(
    document.getElementById("num-constraints").value
  );
  let constraintInputs = document.getElementById("constraint-inputs");
  constraintInputs.innerHTML = "";

  // Create a container div with Bootstrap border class
  let containerDiv = document.createElement("div");
  containerDiv.classList.add("border", "p-3", "rounded");

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

function simplex(c, A, b) {
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

    let pivot_column = tableau[tableau.length - 1]
      .slice(0, -1)
      .indexOf(Math.max(...tableau[tableau.length - 1].slice(0, -1)));

    let ratios = tableau
      .slice(0, -1)
      .map((row) => row[row.length - 1] / row[pivot_column]);
    ratios = ratios.map((value, index) => (value < 0 ? Infinity : value));
    let pivot_row = ratios.indexOf(Math.min(...ratios));

    if (ratios[pivot_row] === Infinity) {
      return [null, null];
    }

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

  let optimal_solution = Array.from({ length: c.length }, () => 0);
  basic_variables.forEach((col, index) => {
    if (col < c.length) {
      optimal_solution[col] = tableau[index][tableau[0].length - 1];
    }
  });

  let optimal_value = -tableau[tableau.length - 1][tableau[0].length - 1];
  return [optimal_solution, optimal_value];
}

function solve() {
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

  let [variables, obj] = simplex(c, A, b);
  let output = document.getElementById("output");

  if (variables === null && obj === null) {
    output.innerHTML = `<div class="alert alert-danger" role="alert">Optimization is not possible!</div>`;
    return;
  }

  let variablesHtml = "";
  for (let i = 0; i < num_vars; i++) {
    variablesHtml += `<tr><th scope="row">x${i + 1}</th><td>${
      variables[i]
    }</td></tr>`;
  }

  output.innerHTML = `
        <div class="table-container">
            <h2 class="text-center mb-3 title">Solution optimale</h2>
            <table class="table table-bordered">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col">Variable</th>
                        <th scope="col">Valeur</th>
                    </tr>
                </thead>
                <tbody>
                    ${variablesHtml}
                    <tr class="red-row"> 
                        <th scope="row">Z : la valeur objectif</th>
                        <td>${obj}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

document.getElementById("num-vars").addEventListener("change", get_input);
document
  .getElementById("num-constraints")
  .addEventListener("change", get_input);
