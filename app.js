let students =
  JSON.parse(localStorage.getItem("students")) || [];

let teacherTasks =
  JSON.parse(localStorage.getItem("teacherTasks")) || [];

let studentStatuses =
  JSON.parse(localStorage.getItem("studentStatuses")) || {};


function saveData() {

  localStorage.setItem(
    "students",
    JSON.stringify(students)
  );

  localStorage.setItem(
    "teacherTasks",
    JSON.stringify(teacherTasks)
  );

  localStorage.setItem(
    "studentStatuses",
    JSON.stringify(studentStatuses)
  );
}


function showPage(page) {

  document.querySelectorAll(".page").forEach(section => {
    section.classList.add("hidden");
  });

  document.getElementById(page).classList.remove("hidden");

  updateDashboard();
  displayStudents();
  displayTeacherTasks();
}


function addStudent() {

  const name =
    document.getElementById("studentName").value.trim();

  const roll =
    Number(document.getElementById("rollNo").value);

  const phone =
    document.getElementById("phone").value.trim();

  const studentClass =
    document.getElementById("studentClass").value.trim();


  if (!name || !roll) {

    alert("Student Name आणि Roll No आवश्यक आहे.");

    return;
  }


  if (students.some(s => s.roll === roll)) {

    alert("हा Roll No आधीच वापरला आहे.");

    return;
  }


  students.push({

    id: Date.now(),

    name,

    roll,

    phone,

    studentClass
  });


  students.sort((a, b) => a.roll - b.roll);

  saveData();

  document.getElementById("studentName").value = "";
  document.getElementById("rollNo").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("studentClass").value = "";

  displayStudents();

  updateDashboard();

  alert("Student added successfully!");
}


function displayStudents() {

  const grid =
    document.getElementById("studentGrid");

  if (!grid) return;


  const search =
    document.getElementById("studentSearch")
      ?.value
      .toLowerCase() || "";


  grid.innerHTML = "";


  students
    .filter(student =>
      student.name.toLowerCase().includes(search)
    )
    .sort((a, b) => a.roll - b.roll)
    .forEach(student => {

      const total =
        teacherTasks.length;

      const complete =
        teacherTasks.filter(task =>
          getStatus(student.id, task.id) === "Complete"
        ).length;


      grid.innerHTML += `

        <div
          class="student-card"
          onclick="openStudent(${student.id})"
        >

          <div class="roll">
            Roll No: ${student.roll}
          </div>

          <div class="student-name">
            👨‍🎓 ${escapeHTML(student.name)}
          </div>

          <div>
            ${escapeHTML(student.studentClass || "")}
          </div>

          <div class="badge">
            ${complete}/${total} Complete
          </div>

        </div>

      `;
    });
}


function openStudent(studentId) {

  const student =
    students.find(s => s.id === studentId);

  if (!student) return;


  document.querySelectorAll(".page").forEach(section => {
    section.classList.add("hidden");
  });

  document
    .getElementById("studentProfile")
    .classList.remove("hidden");


  const profile =
    document.getElementById("profileBox");


  let total =
    teacherTasks.length;

  let complete = 0;


  teacherTasks.forEach(task => {

    if (
      getStatus(student.id, task.id) === "Complete"
    ) {
      complete++;
    }

  });


  const percentage =
    total === 0
      ? 0
      : Math.round((complete / total) * 100);


  let tasksHTML = "";


  if (teacherTasks.length === 0) {

    tasksHTML =
      `<p>📚 अजून कोणताही task add केलेला नाही.</p>`;

  } else {

    teacherTasks.forEach(task => {

      const status =
        getStatus(student.id, task.id);


      tasksHTML += `

        <div class="task">

          <h3>
            ${escapeHTML(task.title)}
          </h3>

          <p>
            ${escapeHTML(task.type)}
          </p>

          <p>
            📅 ${task.date || "-"}
          </p>

          <p>
            📝 ${escapeHTML(task.description || "-")}
          </p>

          <strong>
            Current Status: ${status}
          </strong>

          <div class="status-buttons">

            <button
              class="pending"
              onclick="setStatus(
                ${student.id},
                ${task.id},
                'Pending'
              )"
            >
              🟡 Pending
            </button>


            <button
              class="incomplete"
              onclick="setStatus(
                ${student.id},
                ${task.id},
                'Incomplete'
              )"
            >
              🟠 Incomplete
            </button>


            <button
              class="complete"
              onclick="setStatus(
                ${student.id},
                ${task.id},
                'Complete'
              )"
            >
              🟢 Complete
            </button>


            <button
              class="wrong"
              onclick="setStatus(
                ${student.id},
                ${task.id},
                'Wrong'
              )"
            >
              🔴 Wrong
            </button>

          </div>

        </div>

      `;

    });

  }


  profile.innerHTML = `

    <div class="profile">

      <div class="profile-header">

        <h2>
          👨‍🎓 ${escapeHTML(student.name)}
        </h2>

        <p>
          Roll No: ${student.roll}
        </p>

        <p>
          Class: ${escapeHTML(
            student.studentClass || "-"
          )}
        </p>

        <p>
          📞 ${escapeHTML(student.phone || "-")}
        </p>

        <div class="progress">

          <div
            class="progress-bar"
            style="width:${percentage}%"
          ></div>

        </div>

        <strong>
          📊 ${percentage}% Complete
        </strong>

      </div>


      <h3>📚 All Assigned Tasks</h3>

      ${tasksHTML}

    </div>

  `;
}


function addTeacherTask() {

  const type =
    document.getElementById("taskType").value;

  const title =
    document.getElementById("taskTitle").value.trim();

  const description =
    document.getElementById("taskDescription")
      .value
      .trim();

  const date =
    document.getElementById("taskDate").value;


  if (!title) {

    alert("Task / Chapter Name टाका.");

    return;
  }


  const task = {

    id: Date.now(),

    type,

    title,

    description,

    date
  };


  teacherTasks.push(task);


  // प्रत्येक existing student साठी सुरुवातीचा status
  students.forEach(student => {

    const key =
      `${student.id}_${task.id}`;

    studentStatuses[key] = "Pending";

  });


  saveData();


  document.getElementById("taskTitle").value = "";

  document.getElementById("taskDescription").value = "";

  document.getElementById("taskDate").value = "";


  displayTeacherTasks();

  updateDashboard();

  alert(
    "Task सर्व students साठी successfully add झाला!"
  );
}


function displayTeacherTasks() {

  const box =
    document.getElementById("allTasks");

  if (!box) return;


  box.innerHTML = "";


  teacherTasks
    .slice()
    .reverse()
    .forEach(task => {

      box.innerHTML += `

        <div class="task">

          <h3>
            📚 ${escapeHTML(task.title)}
          </h3>

          <p>
            ${escapeHTML(task.type)}
          </p>

          <p>
            📅 ${task.date || "-"}
          </p>

          <p>
            ${escapeHTML(task.description || "")}
          </p>

          <button
            class="delete"
            onclick="deleteTask(${task.id})"
          >
            🗑️ Delete Task
          </button>

        </div>

      `;

    });
}


function deleteTask(taskId) {

  if (
    !confirm(
      "हा task सर्व students मधून delete होईल. Continue?"
    )
  ) {
    return;
  }


  teacherTasks =
    teacherTasks.filter(
      task => task.id !== taskId
    );


  Object.keys(studentStatuses).forEach(key => {

    if (key.endsWith(`_${taskId}`)) {
      delete studentStatuses[key];
    }

  });


  saveData();

  displayTeacherTasks();

  updateDashboard();
}


function getStatus(studentId, taskId) {

  const key =
    `${studentId}_${taskId}`;


  return studentStatuses[key] || "Pending";
}


function setStatus(studentId, taskId, status) {

  const key =
    `${studentId}_${taskId}`;


  studentStatuses[key] = status;


  saveData();


  openStudent(studentId);

  updateDashboard();

  displayStudents();
}


function updateDashboard() {

  const totalStudents =
    students.length;


  const totalTasks =
    teacherTasks.length;


  let totalAssigned =
    totalStudents * totalTasks;


  let completed = 0;

  let pending = 0;


  students.forEach(student => {

    teacherTasks.forEach(task => {

      const status =
        getStatus(student.id, task.id);


      if (status === "Complete") {
        completed++;
      }


      if (status === "Pending") {
        pending++;
      }

    });

  });


  document.getElementById(
    "totalStudents"
  ).textContent = totalStudents;


  document.getElementById(
    "totalTasks"
  ).textContent = totalTasks;


  document.getElementById(
    "completed"
  ).textContent = completed;


  document.getElementById(
    "pending"
  ).textContent = pending;
}


function escapeHTML(text) {

  return String(text)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");
}


showPage("dashboard");
