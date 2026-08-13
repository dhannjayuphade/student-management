import {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "./firebase.js";


let currentUser = null;
let currentUserData = null;

let students = [];
let users = [];
let tasks = [];
let statuses = [];

let unsubscribeUsers = null;
let unsubscribeStudents = null;
let unsubscribeTasks = null;
let unsubscribeStatuses = null;


/* =========================
   AUTH
========================= */

window.login = async function () {

  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  const message =
    document.getElementById("loginMessage");

  if (!email || !password) {

    message.textContent =
      "Email आणि password टाका.";

    return;
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    message.textContent =
      getFriendlyError(error);

  }
};


window.register = async function () {

  const name =
    document.getElementById("regName").value.trim();

  const email =
    document.getElementById("regEmail").value.trim();

  const password =
    document.getElementById("regPassword").value;

  const role =
    document.getElementById("regRole").value;

  const message =
    document.getElementById("registerMessage");


  if (!name || !email || !password) {

    message.textContent =
      "सर्व fields भरा.";

    return;
  }


  try {

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    await setDoc(
      doc(db, "users", result.user.uid),
      {
        uid: result.user.uid,
        name,
        email,
        role,
        subject: role === "teacher"
          ? "Physics"
          : "",
        createdAt: serverTimestamp()
      }
    );


    message.textContent =
      "Account तयार झाले.";

  } catch (error) {

    message.textContent =
      getFriendlyError(error);

  }
};


window.logout = async function () {

  await signOut(auth);

};


window.showRegister = function () {

  document
    .getElementById("loginPage")
    .classList.add("hidden");

  document
    .getElementById("registerPage")
    .classList.remove("hidden");

};


window.showLogin = function () {

  document
    .getElementById("registerPage")
    .classList.add("hidden");

  document
    .getElementById("loginPage")
    .classList.remove("hidden");

};


onAuthStateChanged(auth, async user => {

  if (!user) {

    currentUser = null;

    document
      .getElementById("app")
      .classList.add("hidden");

    document
      .getElementById("loginPage")
      .classList.remove("hidden");

    return;
  }


  currentUser = user;


  const userSnap =
    await getDoc(
      doc(db, "users", user.uid)
    );


  if (!userSnap.exists()) {

    alert(
      "User profile Firestore मध्ये सापडले नाही."
    );

    await signOut(auth);

    return;
  }


  currentUserData =
    userSnap.data();


  document
    .getElementById("loginPage")
    .classList.add("hidden");

  document
    .getElementById("registerPage")
    .classList.add("hidden");

  document
    .getElementById("app")
    .classList.remove("hidden");


  document.getElementById("userInfo").textContent =
    `${currentUserData.name} • ${currentUserData.role}`;


  setupPermissions();

  startListeners();

  showPage("dashboard");

});


/* =========================
   PERMISSIONS
========================= */

function setupPermissions() {

  const role =
    currentUserData.role;


  const teacherNav =
    document.getElementById("teacherNav");

  const peopleNav =
    document.getElementById("peopleNav");


  if (
    role === "student"
  ) {

    teacherNav.classList.add("hidden");
    peopleNav.classList.add("hidden");

  } else {

    teacherNav.classList.remove("hidden");

  }


  if (
    role === "admin" ||
    role === "principal"
  ) {

    peopleNav.classList.remove("hidden");

  } else {

    peopleNav.classList.add("hidden");

  }

}


/* =========================
   FIRESTORE LISTENERS
========================= */

function startListeners() {

  stopListeners();


  unsubscribeUsers =
    onSnapshot(
      collection(db, "users"),
      snap => {

        users =
          snap.docs.map(
            d => ({
              id: d.id,
              ...d.data()
            })
          );

        updateDashboard();
        renderUsers();

      }
    );


  unsubscribeStudents =
    onSnapshot(
      collection(db, "students"),
      snap => {

        students =
          snap.docs.map(
            d => ({
              id: d.id,
              ...d.data()
            })
          )
          .sort(
            (a,b) =>
              Number(a.roll) - Number(b.roll)
          );


        renderStudents();

        updateDashboard();

        updateReportSelect();

      }
    );


  unsubscribeTasks =
    onSnapshot(
      collection(db, "tasks"),
      snap => {

        tasks =
          snap.docs.map(
            d => ({
              id: d.id,
              ...d.data()
            })
          )
          .sort(
            (a,b) =>
              String(b.date || "")
                .localeCompare(
                  String(a.date || "")
                )
          );


        renderTasks();

        updateDashboard();

      }
    );


  unsubscribeStatuses =
    onSnapshot(
      collection(db, "statuses"),
      snap => {

        statuses =
          snap.docs.map(
            d => ({
              id: d.id,
              ...d.data()
            })
          );


        renderStudents();

        updateDashboard();

      }
    );

}


function stopListeners() {

  if (unsubscribeUsers)
    unsubscribeUsers();

  if (unsubscribeStudents)
    unsubscribeStudents();

  if (unsubscribeTasks)
    unsubscribeTasks();

  if (unsubscribeStatuses)
    unsubscribeStatuses();

}


/* =========================
   NAVIGATION
========================= */

window.showPage = function (page) {

  document
    .querySelectorAll(".page")
    .forEach(p =>
      p.classList.add("hidden")
    );


  document
    .getElementById(page)
    .classList.remove("hidden");


  if (page === "students")
    renderStudents();

  if (page === "tasks")
    renderTasks();

  if (page === "people")
    renderUsers();

  if (page === "reports")
    updateReportSelect();

};


/* =========================
   STUDENTS
========================= */

window.addStudent = async function () {

  const role =
    currentUserData.role;


  if (
    ![
      "admin",
      "principal",
      "teacher"
    ].includes(role)
  ) {

    alert("Permission denied.");

    return;
  }


  const name =
    document
      .getElementById("studentName")
      .value.trim();

  const roll =
    Number(
      document
        .getElementById("rollNo")
        .value
    );

  const phone =
    document
      .getElementById("studentPhone")
      .value.trim();

  const studentClass =
    document
      .getElementById("studentClass")
      .value.trim();


  if (!name || !roll) {

    alert(
      "Student name आणि roll number आवश्यक आहे."
    );

    return;
  }


  const duplicate =
    students.some(
      s => Number(s.roll) === roll
    );


  if (duplicate) {

    alert(
      "हा Roll No आधीच आहे."
    );

    return;
  }


  await addDoc(
    collection(db, "students"),
    {
      name,
      roll,
      phone,
      studentClass,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    }
  );


  document.getElementById("studentName").value = "";
  document.getElementById("rollNo").value = "";
  document.getElementById("studentPhone").value = "";
  document.getElementById("studentClass").value = "";

};


function renderStudents() {

  const grid =
    document.getElementById("studentGrid");

  if (!grid)
    return;


  const search =
    document
      .getElementById("studentSearch")
      ?.value
      .toLowerCase() || "";


  grid.innerHTML = "";


  students
    .filter(s =>
      String(s.name)
        .toLowerCase()
        .includes(search)
    )
    .forEach(student => {


      const assigned =
        tasks.length;


      const completed =
        tasks.filter(
          task =>
            getStatus(
              student.id,
              task.id
            ) === "Complete"
        ).length;


      grid.innerHTML += `

        <div
          class="student-card"
          onclick="openStudent('${student.id}')"
        >

          <div class="roll">
            Roll No: ${student.roll}
          </div>

          <div class="student-name">
            👨‍🎓 ${escapeHTML(student.name)}
          </div>

          <p>
            ${escapeHTML(
              student.studentClass || ""
            )}
          </p>

          <small>
            🟢 ${completed}/${assigned} Complete
          </small>

        </div>

      `;

    });

}


window.openStudent = function(studentId) {

  const student =
    students.find(
      s => s.id === studentId
    );

  if (!student)
    return;


  showPage("profile");


  const profile =
    document.getElementById("profileBox");


  let html = `
    <div class="profile">

      <div class="profile-header">

        <h2>
          👨‍🎓 ${escapeHTML(student.name)}
        </h2>

        <p>
          Roll No: ${student.roll}
        </p>

        <p>
          Class:
          ${escapeHTML(
            student.studentClass || "-"
          )}
        </p>

        <p>
          📞
          ${escapeHTML(
            student.phone || "-"
          )}
        </p>

      </div>

      <h3>
        📚 Assigned Tasks
      </h3>
  `;


  tasks.forEach(task => {

    const status =
      getStatus(
        student.id,
        task.id
      );


    html += `

      <div class="task">

        <h3>
          ${escapeHTML(task.title)}
        </h3>

        <p>
          📚 ${escapeHTML(task.subject)}
        </p>

        <p>
          ${escapeHTML(task.type)}
        </p>

        <p>
          📅 ${escapeHTML(task.date || "-")}
        </p>

        <p>
          ${escapeHTML(
            task.description || ""
          )}
        </p>

        <strong>
          Status: ${status}
        </strong>

        ${
          canEditTaskStatus(task)
          ? `

          <div class="status-buttons">

            <button
              class="pending"
              onclick="setStatus(
                '${student.id}',
                '${task.id}',
                'Pending'
              )"
            >
              🟡 Pending
            </button>

            <button
              class="incomplete"
              onclick="setStatus(
                '${student.id}',
                '${task.id}',
                'Incomplete'
              )"
            >
              🟠 Incomplete
            </button>

            <button
              class="complete"
              onclick="setStatus(
                '${student.id}',
                '${task.id}',
                'Complete'
              )"
            >
              🟢 Complete
            </button>

            <button
              class="wrong"
              onclick="setStatus(
                '${student.id}',
                '${task.id}',
                'Wrong'
              )"
            >
              🔴 Wrong
            </button>

          </div>

          `
          : ""
        }

      </div>

    `;

  });


  html += `</div>`;

  profile.innerHTML = html;

};


function canEditTaskStatus(task) {

  const role =
    currentUserData.role;


  if (
    role === "admin" ||
    role === "principal"
  )
    return true;


  if (role === "teacher")
    return task.createdBy === currentUser.uid;


  return false;

}


/* =========================
   TASKS
========================= */

window.addTask = async function() {

  const role =
    currentUserData.role;


  if (
    ![
      "admin",
      "principal",
      "teacher"
    ].includes(role)
  ) {

    alert(
      "Only staff can create tasks."
    );

    return;
  }


  const subject =
    document
      .getElementById("taskSubject")
      .value;


  const type =
    document
      .getElementById("taskType")
      .value;


  const title =
    document
      .getElementById("taskTitle")
      .value.trim();


  const description =
    document
      .getElementById("taskDescription")
      .value.trim();


  const date =
    document
      .getElementById("taskDate")
      .value;


  if (!title) {

    alert("Task title टाका.");

    return;
  }


  await addDoc(
    collection(db, "tasks"),
    {
      subject,
      type,
      title,
      description,
      date,
      createdBy: currentUser.uid,
      createdByName:
        currentUserData.name,
      createdAt:
        serverTimestamp()
    }
  );


  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskDate").value = "";


  alert(
    "Task सर्व students साठी assign झाला."
  );

};


function renderTasks() {

  const box =
    document.getElementById("taskList");

  if (!box)
    return;


  box.innerHTML = "";


  tasks.forEach(task => {

    box.innerHTML += `

      <div class="task">

        <h3>
          📚 ${escapeHTML(task.title)}
        </h3>

        <p>
          Subject:
          ${escapeHTML(task.subject)}
        </p>

        <p>
          Type:
          ${escapeHTML(task.type)}
        </p>

        <p>
          📅 ${escapeHTML(task.date || "-")}
        </p>

        <p>
          ${escapeHTML(
            task.description || ""
          )}
        </p>

        <small>
          Created by:
          ${escapeHTML(
            task.createdByName || ""
          )}
        </small>

      </div>

    `;

  });

}


/* =========================
   STATUS
========================= */

function getStatus(studentId, taskId) {

  const found =
    statuses.find(
      s =>
        s.studentId === studentId &&
        s.taskId === taskId
    );


  return found?.status || "Pending";

}


window.setStatus = async function(
  studentId,
  taskId,
  status
) {

  const existing =
    statuses.find(
      s =>
        s.studentId === studentId &&
        s.taskId === taskId
    );


  if (existing) {

    await updateDoc(
      doc(
        db,
        "statuses",
        existing.id
      ),
      {
        status,
        updatedBy: currentUser.uid,
        updatedAt:
          serverTimestamp()
      }
    );

  } else {

    await addDoc(
      collection(db, "statuses"),
      {
        studentId,
        taskId,
        status,
        updatedBy: currentUser.uid,
        updatedAt:
          serverTimestamp()
      }
    );

  }


  openStudent(studentId);

};


/* =========================
   USERS
========================= */

function renderUsers() {

  const box =
    document.getElementById("usersList");

  if (!box)
    return;


  const role =
    currentUserData.role;


  if (
    ![
      "admin",
      "principal"
    ].includes(role)
  ) {

    box.innerHTML =
      "<p>Access denied.</p>";

    return;
  }


  box.innerHTML = "";


  users.forEach(user => {

    box.innerHTML += `

      <div class="user-card">

        <h3>
          ${escapeHTML(user.name)}
        </h3>

        <p>
          ${escapeHTML(user.email)}
        </p>

        <p>
          Role:
          <strong>
            ${escapeHTML(user.role)}
          </strong>
        </p>

        ${
          user.subject
          ? `<p>Subject: ${escapeHTML(user.subject)}</p>`
          : ""
        }

      </div>

    `;

  });

}


/* =========================
   REPORT
========================= */

function updateReportSelect() {

  const select =
    document.getElementById(
      "reportStudent"
    );

  if (!select)
    return;


  select.innerHTML =
    `<option value="">
      Select Student
    </option>`;


  students.forEach(student => {

    select.innerHTML += `

      <option value="${student.id}">
        ${escapeHTML(student.name)}
        - Roll ${student.roll}
      </option>

    `;

  });

}


window.showStudentReport = function() {

  const id =
    document
      .getElementById("reportStudent")
      .value;


  const box =
    document.getElementById("reportBox");


  if (!id) {

    box.innerHTML = "";

    return;
  }


  const student =
    students.find(
      s => s.id === id
    );


  if (!student)
    return;


  const studentTasks =
    tasks.filter(task => {

      if (
        currentUserData.role === "teacher"
      ) {

        return task.createdBy === currentUser.uid;

      }

      return true;

    });


  const total =
    studentTasks.length;


  const complete =
    studentTasks.filter(
      task =>
        getStatus(
          student.id,
          task.id
        ) === "Complete"
    ).length;


  const pending =
    studentTasks.filter(
      task =>
        getStatus(
          student.id,
          task.id
        ) === "Pending"
    ).length;


  const incomplete =
    studentTasks.filter(
      task =>
        getStatus(
          student.id,
          task.id
        ) === "Incomplete"
    ).length;


  const wrong =
    studentTasks.filter(
      task =>
        getStatus(
          student.id,
          task.id
        ) === "Wrong"
    ).length;


  const percentage =
    total
      ? Math.round(
          complete / total * 100
        )
      : 0;


  box.innerHTML = `

    <div class="profile">

      <h2>
        👨‍🎓
        ${escapeHTML(student.name)}
      </h2>

      <p>
        Roll No: ${student.roll}
      </p>

      <div class="progress">

        <div
          class="progress-bar"
          style="width:${percentage}%"
        ></div>

      </div>

      <h3>
        ${percentage}% Complete
      </h3>

      <br>

      <p>
        📚 Total: ${total}
      </p>

      <p>
        🟢 Complete: ${complete}
      </p>

      <p>
        🟡 Pending: ${pending}
      </p>

      <p>
        🟠 Incomplete: ${incomplete}
      </p>

      <p>
        🔴 Wrong: ${wrong}
      </p>

    </div>

  `;

};


/* =========================
   DASHBOARD
========================= */

function updateDashboard() {

  const role =
    currentUserData?.role;


  document.getElementById(
    "totalStudents"
  ).textContent =
    students.length;


  document.getElementById(
    "totalTeachers"
  ).textContent =
    users.filter(
      u => u.role === "teacher"
    ).length;


  let visibleTasks = tasks;


  if (role === "teacher") {

    visibleTasks =
      tasks.filter(
        t =>
          t.createdBy === currentUser.uid
      );

  }


  document.getElementById(
    "totalTasks"
  ).textContent =
    visibleTasks.length;


  const completed =
    statuses.filter(s => {

      if (
        s.status !== "Complete"
      )
        return false;


      const task =
        tasks.find(
          t => t.id === s.taskId
        );


      if (!task)
        return false;


      if (
        role === "teacher"
      ) {

        return (
          task.createdBy === currentUser.uid
        );

      }


      return true;

    }).length;


  document.getElementById(
    "totalCompleted"
  ).textContent =
    completed;

}


/* =========================
   HELPERS
========================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function getFriendlyError(error) {

  const code =
    error?.code || "";


  if (
    code.includes("invalid-credential")
  )
    return "Email किंवा password चुकीचा आहे.";


  if (
    code.includes("email-already-in-use")
  )
    return "हा email आधीपासून वापरलेला आहे.";


  if (
    
