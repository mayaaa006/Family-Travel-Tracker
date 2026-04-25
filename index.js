import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId;

let users = [
  //{ id: 1, name: "Angela", color: "teal" },
  //{ id: 2, name: "Jack", color: "powderblue" },
];
let result = await db.query("SELECT * FROM users");
users = result.rows;
console.log(users);
if (users.length) {
  currentUserId = users[0].id;
}
async function checkVisisted() {
  const result = await db.query(
    "SELECT country_code FROM visited_country WHERE user_id = $1",
    [currentUserId],
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
app.get("/", async (req, res) => {
  if (!users.length) {
    res.render("new.ejs");
  } else {
    //currentUserId = users[0].id;
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: "teal",
    });
  }
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()],
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_country (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId],
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    console.log(currentUserId);
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html

  await db.query("INSERT INTO users (user_name, color) VALUES ($1, $2)", [
    req.body.name,
    req.body.color,
  ]);
  let result = await db.query("SELECT * FROM users");
  users = result.rows;
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
