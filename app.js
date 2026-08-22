import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp
} from "./firebase.js";


/* =========================================================
   GLOBAL STATE
========================================================= */

let selectedRole = "";
let selectedSubject = "";

window.selectRole = function(role) {

  selectedRole = role;

  const roleScreen =
    document.getElementById("roleScreen");

  const subjectScreen =
    document.getElementById("subjectScreen");

  const title =
    document.getElementById("selectedRoleTitle");

  if (title) {

    title.textContent =
      role.charAt(0).toUpperCase() +
      role.slice(1);

  }

  if (roleScreen)
    roleScreen.classList.add("hidden");

  if (subjectScreen)
    subjectScreen.classList.remove("hidden");
};


window.selectSubject = async function(subject) {

  selectedSubject = subject;

  const subjectScreen =
    document.getElementById("subjectScreen");

  const app =
    document.getElementById("app");

  const userInfo =
    document.getElementById("userInfo");

  const subjectName =
    document.getElementById("subjectName");

  if (subjectScreen)
    subjectScreen.classList.add("hidden");

  if (app)
    app.classList.remove("hidden");

  if (userInfo) {

    userInfo.textContent =
      `${selectedRole.toUpperCase()} • ${subject}`;

  }

  if (subjectName)
    subjectName.textContent = subject;

  showPage("dashboard");

  console.log(
    "Selected:",
    selectedRole,
    selectedSubject
  );
};


window.backToRoles = function() {

  selectedRole = "";
  selectedSubject = "";

  const roleScreen =
    document.getElementById("roleScreen");

  const subjectScreen =
    document.getElementById("subjectScreen");

  const app =
    document.getElementById("app");

  if (app)
    app.classList.add("hidden");

  if (subjectScreen)
    subjectScreen.classList.add("hidden");

  if (roleScreen)
    roleScreen.classList.remove("hidden");

};


window.showPage = function(page) {

  document
    .querySelectorAll(".page")
    .forEach(section => {

      section.classList.add("hidden");

    });


  const selected =
    document.getElementById(page);

  if (selected)
    selected.classList.remove("hidden");

};
let currentUser = null;
let currentUserData = null;

let currentRole = "";
let currentSubject = "";

let students = [];
let users = [];
let tasks = [];
let statuses = [];

let unsubscribeUsers = null;
let unsubscribeStudents = null;
let unsubscribeTasks = null;
let unsubscribeStatuses = null;


/* =========================================================
   ROLE SELECTION
========================================================= */

window.selectRole = async function(role) {

  currentRole = role;

  const message =
    document.getElementById("startMessage");

  if (message) {
    message.textContent =
      `${roleLabel(role)} selected...`;
  }

  /*
    या demo version मध्ये Firebase Auth login
    required नाही.

    Anonymous demo user तयार केला जातो.
  */

  try {

    let uid =
      localStorage.getItem("demoUserId");

    if (!uid) {

      uid =
        "demo_" +
        role +
        "_" +
        Date.now();

      localStorage.setItem(
        "demoUserId",
        uid
      );
    }

    currentUser = {
      uid: uid,
      displayName: roleLabel(role)
    };

    const userRef =
      doc(
        db,
        "users",
        uid
      );

    const userSnap =
      await getDoc(userRef);

    if (!userSnap.exists()) {

      await setDoc(
        userRef,
        {
          uid: uid,
          name: roleLabel(role),
          role: role,
          email: "",
          subject: "",
          demo: true,
          createdAt:
            serverTimestamp()
        }
      );

    }

    currentUserData =
      (
        await getDoc(userRef)
      ).data();

    openApp();

  } catch(error) {

    console.error(
      "ROLE ERROR:",
      error
    );

    if (message) {
      message.textContent =
        friendlyError(error);
    }

  }

};


/* =========================================================
   ROLE LABEL
========================================================= */

function roleLabel(role) {

  const labels = {

    teacher: "Teacher",

    principal: "Principal",

    admin: "Admin"

  };

  return labels[role] || role;

}


/* =========================================================
   OPEN APP
========================================================= */

function openApp() {

  const start =
    document.getElementById(
      "startScreen"
    );

  const app =
    document.getElementById(
      "app"
    );

  if (start)
    start.classList.add("hidden");

  if (app)
    app.classList.remove("hidden");


  const info =
    document.getElementById(
      "userInfo"
    );

  if (info) {

    info.textContent =
      `${roleLabel(currentRole)}`;

  }


  setupPermissions();

  startListeners();

  showPage("dashboard");

  updateDashboard();

}


/* =========================================================
   LOGOUT / EXIT
========================================================= */

window.logout = async function() {

  stopListeners();

  currentUser = null;
  currentUserData = null;
  currentRole = "";
  currentSubject = "";

  localStorage.removeItem(
    "demoUserId"
  );

  document
    .getElementById("app")
    ?.classList.add("hidden");

  document
    .getElementById("startScreen")
    ?.classList.remove("hidden");

};


/* =========================================================
   AUTH STATE
========================================================= */

/*
  जर Firebase मध्ये आधीपासून authenticated user असेल
  तर त्याला automatically वापरता येईल.

  Demo role system साठी login आवश्यक नाही.
*/

onAuthStateChanged(
  auth,
  async user => {

    if (!user)
      return;

    try {

      currentUser = user;

      const snap =
        await getDoc(
          doc(
            db,
            "users",
            user.uid
          )
        );

      if (snap.exists()) {

        currentUserData =
          snap.data();

        currentRole =
          currentUserData.role ||
          "teacher";

        openApp();

      }

    } catch(error) {

      console.error(
        "AUTH STATE ERROR",
        error
      );

    }

  }
);


/* =========================================================
   PERMISSIONS
========================================================= */

function setupPermissions() {

  const taskNav =
    document.getElementById(
      "taskNav"
    );

  const peopleNav =
    document.getElementById(
      "peopleNav"
    );


  if (taskNav) {

    taskNav.classList.remove(
      "hidden"
    );

  }


  if (
    currentRole === "admin" ||
    currentRole === "principal"
  ) {

    if (peopleNav)
      peopleNav.classList.remove(
        "hidden"
      );

  } else {

    if (peopleNav)
      peopleNav.classList.add(
        "hidden"
      );

  }

}


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
              id: item.id,
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
                id: item.id,
                ...item.data()
              })
            )
            .sort(
              (a,b) =>
                Number(a.roll || 0) -
                Number(b.roll || 0)
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
                id: item.id,
                ...item.data()
              })
            )
            .sort(
              (a,b) =>
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
              id: item.id,
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
    document.getElementById(
      page
    );


  if (!selected)
    return;


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
   TEACHER → SUBJECT
========================================================= */

window.selectSubject = function(
  subject
) {

  currentSubject =
    subject;


  const title =
    document.getElementById(
      "currentSubjectTitle"
    );


  if (title) {

    title.textContent =
      `📚 ${subject} Tasks`;

  }


  showPage("tasks");

  renderTasks();

};


/* =========================================================
   ADD STUDENT
========================================================= */

window.addStudent = async function() {

  if (
    ![
      "teacher",
      "principal",
      "admin"
    ].includes(
      currentRole
    )
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
      s =>
        Number(s.roll) === roll
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
          currentUser?.uid ||
          "demo",
        createdByRole:
          currentRole,
        createdAt:
          serverTimestamp()
      }
    );


    clearStudentForm();

    alert(
      "Student added successfully."
    );

  } catch(error) {

    console.error(
      "ADD STUDENT ERROR",
      error
    );

    alert(
      friendlyError(error)
    );

  }

};


/* =========================================================
   CLEAR STUDENT
========================================================= */

function clearStudentForm() {

  [
    "studentName",
    "rollNo",
    "studentPhone",
    "studentClass"
  ].forEach(
    id => {

      const el =
        document.getElementById(id);

      if (el)
        el.value = "";

    }
  );

}


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
          name.includes(search) ||
          roll.includes(search)
        );

      }
    );


  grid.innerHTML = "";


  if (!filtered.length) {

    grid.innerHTML =
      `<div class="panel">
        No students found.
      </div>`;

    return;

  }


  filtered.forEach(
    student => {

      const total =
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
            👨‍🎓 ${escapeHTML(
              student.name
            )}
          </div>

          <p>
            ${escapeHTML(
              student.studentClass || "-"
            )}
          </p>

          <small>
            🟢 ${completed}/${total}
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
      s =>
        s.id === studentId
    );


  if (!student)
    return;


  showPage("profile");


  const box =
    document.getElementById(
      "profileBox"
    );


  if (!box)
    return;


  let html = `

    <div class="profile">

      <div class="profile-header">

        <h2>
          👨‍🎓 ${escapeHTML(
            student.name
          )}
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
          Phone:
          ${escapeHTML(
            student.phone || "-"
          )}
        </p>

      </div>

      <h3>📚 Tasks</h3>

  `;


  const studentTasks =
    tasks.filter(
      task =>
        !task.subject ||
        task.subject === currentSubject ||
        currentSubject === ""
    );


  if (!studentTasks.length) {

    html +=
      `<p>No tasks assigned.</p>`;

  }


  studentTasks.forEach(
    task => {

      const status =
        getStatus(
          student.id,
          task.id
        );


      html += `

        <div class="profile-task">

          <h3>
            📚 ${escapeHTML(
              task.title
            )}
          </h3>

          <p>
            Subject:
            ${escapeHTML(
              task.subject || "-"
            )}
          </p>

          <p>
            Type:
            ${escapeHTML(
              task.type || "-"
            )}
          </p>

          <p>
            Date:
            ${escapeHTML(
              task.date || "-"
            )}
          </p>

          <p>
            ${escapeHTML(
              task.description || ""
            )}
          </p>

          <strong>
            Status:
            ${escapeHTML(status)}
          </strong>

          ${getStatusButtons(
            student.id,
            task.id
          )}

        </div>

      `;

    }
  );


  html += `</div>`;

  box.innerHTML =
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
      item =>
        item.studentId === studentId &&
        item.taskId === taskId
    );


  return found?.status ||
    "Pending";

}


/* =========================================================
   STATUS BUTTONS
========================================================= */

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
          item.studentId === studentId &&
          item.taskId === taskId
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
          updatedAt:
            serverTimestamp(),
          updatedBy:
            currentUser?.uid ||
            "demo"
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
            currentUser?.uid ||
            "demo",
          createdAt:
            serverTimestamp()
        }
      );

    }

  } catch(error) {

    console.error(
      "STATUS ERROR",
      error
    );

    alert(
      friendlyError(error)
    );

  }

};


/* =========================================================
   ADD TASK
========================================================= */

window.addTask = async function() {

  if (!currentSubject) {

    alert(
      "पहिले Subject select करा."
    );

    showPage("subjects");

    return;

  }


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


  if (!title) {

    alert(
      "Task / Chapter लिहा."
    );

    return;

  }


  try {

    await addDoc(
      collection(
        db,
        "tasks"
      ),
      {
        subject:
          currentSubject,
        type:
          type,
        title:
          title,
        description:
          description,
        date:
          date,
        createdBy:
          currentUser?.uid ||
          "demo",
        createdByRole:
          currentRole,
        createdAt:
          serverTimestamp()
      }
    );


    document.getElementById(
      "taskTitle"
    ).value = "";

    document.getElementById(
      "taskDescription"
    ).value = "";

    document.getElementById(
      "taskDate"
    ).value = "";


    alert(
      `${currentSubject} task saved.`
    );

  } catch(error) {

    console.error(
      "ADD TASK ERROR",
      error
    );

    alert(
      friendlyError(error)
    );

  }

};


/* =========================================================
   RENDER TASKS
========================================================= */

function renderTasks() {

  const list =
    document.getElementById(
      "taskList"
    );


  if (!list)
    return;


  let filtered =
    tasks;


  if (currentSubject) {

    filtered =
      tasks.filter(
        task =>
          task.subject ===
          currentSubject
      );

  }


  list.innerHTML = "";


  if (!filtered.length) {

    list.innerHTML =
      `<div class="panel">
        📚 No tas
