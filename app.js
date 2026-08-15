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

import {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
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

/* =========================================================
   GLOBAL STATE
========================================================= */

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


/* =========================================================
   AUTHENTICATION
========================================================= */
window.googleLogin = async function () {

  const message =
    document.getElementById("loginMessage");

  try {

    if (message)
      message.textContent = "Google login होत आहे...";

    const provider =
      new GoogleAuthProvider();

    const result =
      await signInWithPopup(
        auth,
        provider
      );

    const user =
      result.user;

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    const userSnap =
      await getDoc(userRef);

    if (!userSnap.exists()) {

      await setDoc(
        userRef,
        {
          uid: user.uid,
          name:
            user.displayName ||
            "Google User",
          email:
            user.email || "",
          role: "student",
          subject: "",
          photoURL:
            user.photoURL || "",
          createdAt:
            serverTimestamp()
        }
      );

    }

  } catch (error) {

    console.error(
      "GOOGLE LOGIN ERROR:",
      error
    );

    if (message) {
      message.textContent =
        getFriendlyError(error);
    }

  }

};

window.login = async function () {

  const emailInput =
    document.getElementById("loginEmail");

  const passwordInput =
    document.getElementById("loginPassword");

  const message =
    document.getElementById("loginMessage");

  const email =
    emailInput?.value.trim();

  const password =
    passwordInput?.value || "";

  if (!email || !password) {

    if (message) {
      message.textContent =
        "Email आणि password टाका.";
    }

    return;
  }

  if (message) {
    message.textContent =
      "Logging in...";
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    if (message) {
      message.textContent =
        getFriendlyError(error);
    }
  }
};


/* =========================================================
   REGISTER
========================================================= */

window.register = async function () {

  const name =
    document.getElementById("regName")?.value.trim();

  const email =
    document.getElementById("regEmail")?.value.trim();

  const password =
    document.getElementById("regPassword")?.value || "";

  const role =
    document.getElementById("regRole")?.value;

  const message =
    document.getElementById("registerMessage");


  if (!name || !email || !password) {

    if (message) {
      message.textContent =
        "सर्व fields भरा.";
    }

    return;
  }


  if (password.length < 6) {

    if (message) {
      message.textContent =
        "Password किमान 6 characters असावा.";
    }

    return;
  }


  if (message) {
    message.textContent =
      "Account तयार होत आहे...";
  }


  try {

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    await setDoc(
      doc(
        db,
        "users",
        result.user.uid
      ),
      {
        uid: result.user.uid,
        name: name,
        email: email,
        role: role,
        subject:
          role === "teacher"
            ? "Physics"
            : "",
        createdAt:
          serverTimestamp()
      }
    );


    if (message) {
      message.textContent =
        "Account तयार झाले.";
    }

  } catch (error) {

    console.error(
      "REGISTER ERROR:",
      error
    );

    if (message) {
      message.textContent =
        getFriendlyError(error);
    }
  }
};


/* =========================================================
   LOGOUT
========================================================= */

window.logout = async function () {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );

  }

};


/* =========================================================
   LOGIN / REGISTER UI
========================================================= */

window.showRegister = function () {

  const loginPage =
    document.getElementById("loginPage");

  const registerPage =
    document.getElementById("registerPage");

  if (loginPage)
    loginPage.classList.add("hidden");

  if (registerPage)
    registerPage.classList.remove("hidden");
};


window.showLogin = function () {

  const loginPage =
    document.getElementById("loginPage");

  const registerPage =
    document.getElementById("registerPage");

  if (registerPage)
    registerPage.classList.add("hidden");

  if (loginPage)
    loginPage.classList.remove("hidden");
};


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    console.log(
      "AUTH STATE:",
      user
    );


    if (!user) {

      currentUser = null;
      currentUserData = null;

      stopListeners();

      const app =
        document.getElementById("app");

      const loginPage =
        document.getElementById("loginPage");

      const registerPage =
        document.getElementById("registerPage");


      if (app)
        app.classList.add("hidden");

      if (registerPage)
        registerPage.classList.add("hidden");

      if (loginPage)
        loginPage.classList.remove("hidden");

      return;
    }


    currentUser = user;


    try {

      const userSnap =
        await getDoc(
          doc(
            db,
            "users",
            user.uid
          )
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


      console.log(
        "USER PROFILE:",
        currentUserData
      );


      const loginPage =
        document.getElementById("loginPage");

      const registerPage =
        document.getElementById("registerPage");

      const app =
        document.getElementById("app");


      if (loginPage)
        loginPage.classList.add("hidden");

      if (registerPage)
        registerPage.classList.add("hidden");

      if (app)
        app.classList.remove("hidden");


      const userInfo =
        document.getElementById("userInfo");


      if (userInfo) {

        userInfo.textContent =
          `${currentUserData.name || "User"} • ${currentUserData.role || "student"}`;

      }


      setupPermissions();

      startListeners();

      showPage("dashboard");

    } catch (error) {

      console.error(
        "AUTH PROFILE ERROR:",
        error
      );

      alert(
        getFriendlyError(error)
      );

    }

  }
);


/* =========================================================
   PERMISSIONS
========================================================= */

function setupPermissions() {

  const role =
    currentUserData?.role || "student";


  const teacherNav =
    document.getElementById("teacherNav");

  const peopleNav =
    document.getElementById("peopleNav");


  if (role === "student") {

    if (teacherNav)
      teacherNav.classList.add("hidden");

    if (peopleNav)
      peopleNav.classList.add("hidden");

  } else {

    if (teacherNav)
      teacherNav.classList.remove("hidden");

  }


  if (
    role === "admin" ||
    role === "principal"
  ) {

    if (peopleNav)
      peopleNav.classList.remove("hidden");

  } else {

    if (peopleNav)
      peopleNav.classList.add("hidden");

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


        updateDashboard();
        renderUsers();

      },
      error => {

        console.error(
          "USERS LISTENER:",
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
              (a, b) =>
                Number(a.roll || 0) -
                Number(b.roll || 0)
            );


        renderStudents();

        updateDashboard();

        updateReportSelect();

      },
      error => {

        console.error(
          "STUDENTS LISTENER:",
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
              (a, b) =>
                String(b.date || "")
                  .localeCompare(
                    String(a.date || "")
                  )
            );


        renderTasks();

        updateDashboard();

      },
      error => {

        console.error(
          "TASKS LISTENER:",
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
          "STATUS LISTENER:",
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

window.showPage = function (page) {

  document
    .querySelectorAll(".page")
    .forEach(
      section =>
        section.classList.add("hidden")
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


  selected.classList.remove("hidden");


  if (page === "students") {

    renderStudents();

  }


  if (page === "tasks") {

    renderTasks();

  }


  if (page === "people") {

    renderUsers();

  }


  if (page === "reports") {

    updateReportSelect();

  }

};


/* =========================================================
   ADD STUDENT
========================================================= */

window.addStudent = async function () {

  const role =
    currentUserData?.role;


  if (
    ![
      "admin",
      "principal",
      "teacher"
    ].includes(role)
  ) {

    alert(
      "तुमच्याकडे Student add करण्याची permission नाही."
    );

    return;
  }


  const name =
    document
      .getElementById("studentName")
      ?.value.trim();


  const roll =
    Number(
      document
        .getElementById("rollNo")
        ?.value
    );


  const phone =
    document
      .getElementById("studentPhone")
      ?.value.trim();


  const studentClass =
    document
      .getElementById("studentClass")
      ?.value.trim();


  if (!name || !roll) {

    alert(
      "Student name आणि Roll Number आवश्यक आहे."
    );

    return;
  }


  const duplicate =
    students.some(
      student =>
        Number(student.roll) === roll
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
        name: name,
        roll: roll,
        phone: phone,
        studentClass:
          studentClass,
        createdBy:
          currentUser.uid,
        createdAt:
          serverTimestamp()
      }
    );


    document.getElementById(
      "studentName"
    ).value = "";

    document.getElementById(
      "rollNo"
    ).value = "";

    document.getElementById(
      "studentPhone"
    ).value = "";

    document.getElementById(
      "studentClass"
    ).value = "";


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


  grid.innerHTML = "";


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


  if (!filtered.length) {

    grid.innerHTML =
      `<p>No students found.</p>`;

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
              student.studentClass || ""
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

window.openStudent = function (
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
          👨‍🎓 ${escapeHTML(
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
            📅
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
   CAN EDIT STATUS
========================================================= */

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
      task.createdBy ===
      currentUser.uid
    );

  }


  return false;

}


/* =========================================================
   ADD TASK
========================================================= */

window.addTask = async function () {

  const role =
    currentUserData?.role;


  if (
    ![
      "admin",
      "principal",
      "teacher"
    ].includes(role)
  ) {

    alert(
      "Only Teacher, Principal किंवा Admin can add tasks."
    );

    return;
  }


  const subject =
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
      ?.value.trim();


  const description =
    document
      .getElementById(
        "taskDescription"
      )
      ?.value.trim();


  const date =
    document
      .getElementById(
        "taskDate"
      )
      ?.value;


  if (!title) {

    alert(
      "Task title टाका."
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
          subject || "",
        type:
          type || "",
        title:
          title,
        description:
          description || "",
        date:
          date || "",
        createdBy:
          currentUser.uid,
        createdByName:
          currentUserData.name || "",
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
      "Task सर्व students साठी assign झाला."
    );

  } catch (error) {

    console.error(
      "ADD TASK:"
