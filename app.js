import {
  auth,
  db,
  signInAnonymously,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp
} from "./firebase.js";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentUserData = null;

let students = [];
let users = [];
let tasks = [];
let statuses = [];

let selectedRole = "";
let selectedSubject = "";

let unsubscribeUsers = null;
let unsubscribeStudents = null;
let unsubscribeTasks = null;
let unsubscribeStatuses = null;


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    showRoleScreen();

  }
);


/* =========================================================
   SCREEN HELPERS
========================================================= */

function show(id) {

  const element =
    document.getElementById(id);

  if (element) {

    element.classList.remove("hidden");

  }

}


function hide(id) {

  const element =
    document.getElementById(id);

  if (element) {

    element.classList.add("hidden");

  }

}


function setText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {

    element.textContent = value;

  }

}


function clearValue(id) {

  const element =
    document.getElementById(id);

  if (element) {

    element.value = "";

  }

}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   ROLE SELECTION
========================================================= */

function showRoleScreen() {

  hide("app");
  hide("subjectPage");
  show("loginPage");

}


window.selectRole = async function(role) {

  selectedRole = role;

  if (role === "teacher") {

    hide("loginPage");
    show("subjectPage");

    return;

  }


  if (
    role === "principal" ||
    role === "admin"
  ) {

    await startDemoSession(
      role,
      ""
    );

  }

};


/* =========================================================
   SUBJECT
========================================================= */

window.selectSubject = async function(subject) {

  selectedSubject = subject;

  await startDemoSession(
    "teacher",
    subject
  );

};


window.backToRoles = function() {

  selectedRole = "";
  selectedSubject = "";

  hide("subjectPage");
  show("loginPage");

};


/* =========================================================
   DEMO SESSION
========================================================= */

async function startDemoSession(
  role,
  subject
) {

  try {

    setText(
      "loginMessage",
      "System सुरू होत आहे..."
    );


    /*
      Invisible Firebase authentication.
      User ला password / Google login
      विचारला जात नाही.
    */

    if (!auth.currentUser) {

      await signInAnonymously(auth);

    }


    currentUser =
      auth.currentUser;


    currentUserData = {

      uid:
        currentUser.uid,

      name:
        role === "teacher"
          ? `Teacher • ${subject}`
          : role === "principal"
            ? "Principal"
            : "Admin",

      role:
        role,

      subject:
        subject || ""

    };


    /*
      Firebase users collection मध्ये
      current demo session save/update.
    */

    await setDoc(

      doc(
        db,
        "users",
        currentUser.uid
      ),

      {

        uid:
          currentUser.uid,

        name:
          currentUserData.name,

        role:
          role,

        subject:
          subject || "",

        demo:
          true,

        updatedAt:
          serverTimestamp()

      },

      {
        merge: true
      }

    );


    hide("loginPage");
    hide("subjectPage");
    show("app");


    updateUserInfo();

    setupPermissions();

    startListeners();

    showPage("dashboard");


  } catch (error) {

    console.error(
      "SESSION ERROR:",
      error
    );


    alert(
      getFriendlyError(error)
    );

  }

}


/* =========================================================
   USER INFO
========================================================= */

function updateUserInfo() {

  const role =
    currentUserData?.role || "";

  const subject =
    currentUserData?.subject || "";


  let text =
    currentUserData?.name ||
    "User";


  if (
    role === "teacher" &&
    subject
  ) {

    text +=
      ` • ${subject}`;

  }


  setText(
    "userInfo",
    text
  );

}


/* =========================================================
   PERMISSIONS
========================================================= */

function setupPermissions() {

  const role =
    currentUserData?.role;


  const teacherNav =
    document.getElementById(
      "teacherNav"
    );


  const peopleNav =
    document.getElementById(
      "peopleNav"
    );


  if (teacherNav) {

    teacherNav.classList.remove(
      "hidden"
    );

  }


  if (peopleNav) {

    if (
      role === "admin" ||
      role === "principal"
    ) {

      peopleNav.classList.remove(
        "hidden"
      );

    } else {

      peopleNav.classList.add(
        "hidden"
      );

    }

  }


  const subjectSelect =
    document.getElementById(
      "taskSubject"
    );


  if (
    subjectSelect &&
    role === "teacher"
  ) {

    subjectSelect.value =
      currentUserData.subject;

    subjectSelect.disabled =
      true;

  } else if (subjectSelect) {

    subjectSelect.disabled =
      false;

  }

}


/* =========================================================
   LOGOUT
========================================================= */

window.logout = function() {

  stopListeners();

  currentUser = null;
  currentUserData = null;

  students = [];
  users = [];
  tasks = [];
  statuses = [];

  selectedRole = "";
  selectedSubject = "";

  hide("app");
  hide("subjectPage");

  show("loginPage");

};


/* =========================================================
   FIRESTORE LISTENERS
========================================================= */

function startListeners() {

  stopListeners();


  /* USERS */

  unsubscribeUsers =
    onSnapshot(

      collection(
        db,
        "users"
      ),

      snapshot => {

        users =
          snapshot.docs.map(
            item => ({

              id:
                item.id,

              ...item.data()

            })
          );


        renderUsers();

        updateDashboard();

      },

      error => {

        console.error(
          "USERS ERROR:",
          error
        );

      }

    );


  /* STUDENTS */

  unsubscribeStudents =
    onSnapshot(

      collection(
        db,
        "students"
      ),

      snapshot => {

        students =
          snapshot.docs

            .map(
              item => ({

                id:
                  item.id,

                ...item.data()

              })
            )

            .sort(
              (a, b) =>
                Number(
                  a.roll || 0
                ) -
                Number(
                  b.roll || 0
                )
            );


        renderStudents();

        updateDashboard();

        updateReportSelect();

      },

      error => {

        console.error(
          "STUDENTS ERROR:",
          error
        );

      }

    );


  /* TASKS */

  unsubscribeTasks =
    onSnapshot(

      collection(
        db,
        "tasks"
      ),

      snapshot => {

        tasks =
          snapshot.docs

            .map(
              item => ({

                id:
                  item.id,

                ...item.data()

              })
            )

            .sort(
              (a, b) =>
                String(
                  b.date || ""
                ).localeCompare(
                  String(
                    a.date || ""
                  )
                )
            );


        renderTasks();

        updateDashboard();

      },

      error => {

        console.error(
          "TASKS ERROR:",
          error
        );

      }

    );


  /* STATUSES */

  unsubscribeStatuses =
    onSnapshot(

      collection(
        db,
        "statuses"
      ),

      snapshot => {

        statuses =
          snapshot.docs.map(
            item => ({

              id:
                item.id,

              ...item.data()

            })
          );


        renderStudents();

        updateDashboard();

      },

      error => {

        console.error(
          "STATUS ERROR:",
          error
        );

      }

    );

}


/* =========================================================
   STOP LISTENERS
========================================================= */

function stopListeners() {

  if (unsubscribeUsers) {

    unsubscribeUsers();

    unsubscribeUsers = null;

  }


  if (unsubscribeStudents) {

    unsubscribeStudents();

    unsubscribeStudents = null;

  }


  if (unsubscribeTasks) {

    unsubscribeTasks();

    unsubscribeTasks = null;

  }


  if (unsubscribeStatuses) {

    unsubscribeStatuses();

    unsubscribeStatuses = null;

  }

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

window.showPage = function(page) {

  document
    .querySelectorAll(".page")
    .forEach(
      section =>
        section.classList.add(
          "hidden"
        )
    );


  const selected =
    document.getElementById(page);


  if (!selected) {

    console.warn(
      "Page not found:",
      page
    );

    return;

  }


  selected.classList.remove(
    "hidden"
  );


  if (page === "dashboard")
    updateDashboard();


  if (page === "students")
    renderStudents();


  if (page === "tasks")
    renderTasks();


  if (page === "people")
    renderUsers();


  if (page === "reports")
    updateReportSelect();

};


/* =========================================================
   ADD STUDENT
========================================================= */

window.addStudent = async function() {

  const role =
    currentUserData?.role;


  if (
    ![
      "teacher",
      "principal",
      "admin"
    ].includes(role)
  ) {

    alert(
      "Permission denied."
    );

    return;

  }


  const name =
    document
      .getElementById(
        "studentName"
      )
      ?.value
      .trim();


  const roll =
    Number(
      document
        .getElementById(
          "rollNo"
        )
        ?.value
    );


  const phone =
    document
      .getElementById(
        "studentPhone"
      )
      ?.value
      .trim();


  const studentClass =
    document
      .getElementById(
        "studentClass"
      )
      ?.value
      .trim();


  if (!name || !roll) {

    alert(
      "Student name आणि Roll Number आवश्यक आहे."
    );

    return;

  }


  const duplicate =
    students.some(
      student =>
        Number(
          student.roll
        ) === roll
    );


  if (duplicate) {

    alert(
      "हा Roll Number आधीपासून आहे."
    );

    return;

  }


  try {

    await addDoc(

      collection(
        db,
        "students"
      ),

      {

        name,

        roll,

        phone,

        studentClass,

        createdBy:
          currentUser.uid,

        createdAt:
          serverTimestamp()

      }

    );


    clearValue("studentName");
    clearValue("rollNo");
    clearValue("studentPhone");
    clearValue("studentClass");


    alert(
      "Student successfully added."
    );


  } catch (error) {

    console.error(
      "ADD STUDENT:",
      error
    );


    alert(
      getFriendlyError(error)
    );

  }

};


/* =========================================================
   RENDER STUDENTS
========================================================= */

function renderStudents() {

  const grid =
    document.getElementById(
      "studentGrid"
    );


  if (!grid)
    return;


  const search =
    document
      .getElementById(
        "studentSearch"
      )
      ?.value
      .trim()
      .toLowerCase() || "";


  const filtered =
    students.filter(
      student => {

        const name =
          String(
            student.name || ""
          ).toLowerCase();


        const roll =
          String(
            student.roll || ""
          );


        return (
          name.includes(
            search
          ) ||
          roll.includes(
            search
          )
        );

      }
    );


  grid.innerHTML = "";


  if (!filtered.length) {

    grid.innerHTML =
      `<p>No students found.</p>`;

    return;

  }


  filtered.forEach(
    student => {

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
            👨‍🎓
            ${escapeHTML(
              student.name
            )}
          </div>

          <p>
            ${escapeHTML(
              student.studentClass ||
              "-"
            )}
          </p>

          <small>
            🟢 ${completed}/${tasks.length}
            Complete
          </small>

        </div>

      `;

    }
  );

}


/* =========================================================
   OPEN STUDENT
========================================================= */

window.openStudent = function(
  studentId
) {

  const student =
    students.find(
      item =>
        item.id === studentId
    );


  if (!student)
    return;


  showPage("profile");


  const profile =
    document.getElementById(
      "profileBox"
    );


  if (!profile)
    return;


  let html = `

    <div class="profile">

      <div class="profile-header">

        <h2>
          👨‍🎓
          ${escapeHTML(
            student.name
          )}
        </h2>

        <p>
          Roll No:
          ${student.roll}
        </p>

        <p>
          Class:
          ${escapeHTML(
            student.studentClass ||
            "-"
          )}
        </p>

        <p>
          📞
          ${escapeHTML(
            student.phone ||
            "-"
          )}
        </p>

      </div>

      <h3>
        📚 Assigned Tasks
      </h3>

  `;


  if (!tasks.length) {

    html += `
      <p>
        अजून कोणताही task नाही.
      </p>
    `;

  }


  tasks.forEach(
    task => {

      const status =
        getStatus(
          student.id,
          task.id
        );


      html += `

        <div class="task">

          <h3>
            📚
            ${escapeHTML(
              task.title
            )}
          </h3>

          <p>
            Subject:
            ${escapeHTML(
              task.subject ||
              "-"
            )}
          </p>

          <p>
            Type:
            ${escapeHTML(
              task.type ||
              "-"
            )}
          </p>

          <p>
            📅
            ${escapeHTML(
              task.date ||
              "-"
            )}
          </p>

          <p>
            ${escapeHTML(
              task.description ||
              ""
            )}
          </p>

          <strong>
            Status:
            ${escapeHTML(
              status
            )}
          </strong>

          ${
            canEditTaskStatus(task)
              ? getStatusButtons(
                  student.id,
                  task.id
                )
              : ""
          }

        </div>

      `;

    }
  );


  html += `
    </div>
  `;


  profile.innerHTML =
    html;

};


/* =========================================================
   STATUS
========================================================= */

function getStatus(
  studentId,
  taskId
) {

  const found =
    statuses.find(
      status =>
        status.studentId ===
          studentId &&
        status.taskId ===
          taskId
    );


  return found?.status ||
    "Pending";

}


function canEditTaskStatus(
  task
) {

  const role =
    currentUserData?.role;


  if (
    role === "admin" ||
    role === "principal"
  ) {

    return true;

  }


  if (role === "teacher") {

    return (
      task.subject ===
      currentUserData.subject
    );

  }


  return false;

}


function getStatusButtons(
  studentId,
  taskId
) {

  return `

    <div class="status-buttons">

      <button
        class="pending"
        onclick="setStatus(
          '${studentId}',
          '${taskId}',
          'Pending'
        )"
      >
        🟡 Pending
      </button>

      <button
        class="incomplete"
        onclick="setStatus(
          '${studentId}',
          '${taskId}',
          'Incomplete'
        )"
      >
        🟠 Incomplete
      </button>

      <button
        class="complete"
        onclick="setStatus(
          '${studentId}',
          '${taskId}',
          'Complete'
        )"
      >
        🟢 Complete
      </button>

      <button
        class="wrong"
        onclick="setStatus(
          '${studentId}',
          '${taskId}',
          'Wrong'
        )"
      >
        🔴 Wrong
      </button>

    </div>

  `;

}


/* =========================================================
   SET STATUS
========================================================= */

window.setStatus = async function(
  studentId,
  taskId,
  status
) {

  try {

    const existing =
      statuses.find(
        item =>
          item.studentId ===
            studentId &&
          item.taskId ===
            taskId
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

          updatedBy:
            currentUser.uid,

          updatedAt:
            serverTimestamp()

        }

      );

    } else {

      await addDoc(

        collection(
          db,
          "statuses"
        ),

        {

          studentId,

          taskId,

          status,

          updatedBy:
            currentUser.uid,

          createdAt:
            serverTimestamp()

        }

      );

    }


    openStudent(
      studentId
    );


  } catch (error) {

    console.error(
      "STATUS ERROR:",
      error
    );


    alert(
      getFriendlyError(error)
    );

  }

};


/* =========================================================
   ADD TASK
========================================================= */

window.addTask = async function() {

  const role =
    currentUserData?.role;


  if (
    ![
      "teacher",
      "principal",
      "admin"
    ].includes(role)
  ) {

    alert(
      "Task add करण्याची permission नाही."
    );

    return;

  }


  let subject =
    document
      .getElementById(
        "taskSubject"
      )
      ?.value;


  const type =
    document
      .getElementById(
        "taskType"
      )
      ?.value;


  const title =
    document
      .getElementById(
        "taskTitle"
      )
      ?.value
      .trim();


  const description =
    document
      .getElementById(
        "taskDescription"
      )
      ?.value
      .trim();


  const date =
    document
      .getElementById(
        "taskDate"
      )
      ?.value;


  if (
    role === "teacher" &&
    currentUserData.subject
  ) {

    subject =
      currentUserData.subject;

  }


  if (!title) {

    alert(
      "Task / Chapter टाका."
    );

    return;

  }


  try {

    await addDoc(

      collection(
        db,
        "tasks"
      ),

   
