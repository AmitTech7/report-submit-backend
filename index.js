const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { chromium } = require("playwright");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const OTHER_PROJECT_TYPE_MAP = {
  "Lunch break": "ccb54773-cf7e-4efd-98c8-3ef11a6fa9f4",
  "Birthday/Anniversary Celebrations": "1528a2dc-bc05-4e82-ab5e-eb876a5b7243",
};

const STUDIO_BOOKING_TYPE_MAP = {
  scrum: "c90c0050-8786-4319-bbee-afc1746fcc81",
  development: "92510084-3258-4899-84bf-9b0e3939ce0f",
  report: "dbb732d8-19f7-4d07-a909-fb74fb44ff99", // dummy fallback
};

const FIXED_TASKS = (type) => [
  {
    task: "Work plan, ongoing task discussion (scrum) with team mates and planning of week and Project setup",
    start: "09:45 AM",
    end: "10:30 AM",
    project: "Studio Booking",
    type: "scrum",
    typeValue: STUDIO_BOOKING_TYPE_MAP["scrum"],
  },
  {
    task: "Worked on tasks",
    start: "10:30 AM",
    end: "01:30 PM",
    project: "Studio Booking",
    type: "development",
    typeValue: STUDIO_BOOKING_TYPE_MAP["development"],
  },
  {
    task: "Lunch Break",
    start: "01:30 PM",
    end: "02:00 PM",
    project: "Others",
    type: "Lunch break",
    typeValue: OTHER_PROJECT_TYPE_MAP["Lunch break"],
  },
  {
    task: "Worked on tasks",
    start: "02:00 PM",
    end: "03:30 PM",
    project: "Studio Booking",
    type: "development",
    typeValue: STUDIO_BOOKING_TYPE_MAP["development"],
  },
  {
    task:
      type === "Birthday/Anniversary Celebrations"
        ? "Worked on joining celebration - Birthday/Anniversary Celebrations"
        : "Worked on task",
    start: "03:30 PM",
    end: "05:30 PM",
    project:
      type === "Birthday/Anniversary Celebrations"
        ? "Others"
        : "Studio Booking",
    type: type,
    typeValue:
      type === "Birthday/Anniversary Celebrations"
        ? OTHER_PROJECT_TYPE_MAP[type]
        : STUDIO_BOOKING_TYPE_MAP["development"],
  },
  {
    task: "Worked on task",
    start: "05:30 PM",
    end: "06:00 PM",
    project: "Studio Booking",
    type: "development",
    typeValue: STUDIO_BOOKING_TYPE_MAP["development"],
  },
  {
    task: "Worked on work report and coordinating with team members",
    start: "06:00 PM",
    end: "06:50 PM",
    project: "Studio Booking",
    type: "development",
    typeValue: STUDIO_BOOKING_TYPE_MAP["development"],
  },
];

app.post("/submit", async (req, res) => {
  const { date, type } = req.body;
  const tasks = FIXED_TASKS(type).map((task) => ({
    ...task,
    date,
  }));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: "auth.json" });
  const page = await context.newPage();

  await page.goto("https://peoplehr.ditstek.com/report/add");
  // if (tasks.length > 0) {
  //   // await page.click("#reportDate"); // focus the field
  //   await page.fill("#reportDate", tasks[0].date); // fill the date
  //   await page.keyboard.press("Escape");
  //   await page.keyboard.press("Tab"); // simulate user tabbing out (triggers API/UI change
  //   // await page.selectOption("#projectId", tasks[0].typeValue);
  //   await page.waitForTimeout(3000);
  //   // await page.fill("#reportDate", tasks[0].date);
  //   // await page.keyboard.press("Escape"); // close time picker popup
  //   //  await page.waitForTimeout(3000);
  // }
  // for (const task of tasks) {
  for (const [index, task] of tasks.entries()) {
    console.log(tasks, "task");
   await page.evaluate((date) => {
  const input = document.querySelector("#reportDate");
  input.value = date;

  // Trigger the input and change events
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}, task.date);

await page.waitForTimeout(2000); // Let calendar react
await page.keyboard.press("Escape"); // Close datepicker if open
await page.keyboard.press("Tab");    // Trigger any blur handlers


    // await page.fill("#reportDate", task.date);
    // await page.waitForTimeout(2000);
    // await page.keyboard.press("Escape");
    // await page.keyboard.press("Tab");
    await page.selectOption("#projectId", { label: task.project });
    await page.waitForTimeout(2000);
    await page.selectOption("#type", task.typeValue);

    await page.fill("#start_time", task.start);
    await page.keyboard.press("Escape"); // close time picker popup

    await page.fill('input[name="time_to"]', task.end);
    await page.keyboard.press("Escape"); // close time picker popup

    await page.waitForSelector(".note-editable");
    await page.locator(".note-editable").fill(task.task);

    await page.click('button:has-text("Add Task")');
    await page.waitForTimeout(2000);
  }

  await page.click('button:has-text("Submit")');
  await browser.close();

  res.json({ message: "✅ Generic report submitted successfully!" });
});

app.listen(5000, () =>
  console.log("✅ Server running on http://localhost:5000")
);
