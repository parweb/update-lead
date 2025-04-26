import postgres from "postgres";

const sql = postgres(String(process.env.DATABASE_URL));

const users =
  await sql`SELECT * FROM "User" WHERE role = ${"LEAD"} AND location = '{}' ORDER BY RANDOM() LIMIT 47`;

const results = await Promise.allSettled(
  users.map(async (user) => {
    try {
      const location = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${user.address.replace(" ", "+")}+${user.postcode}+${user.city.replace(" ", "+")}&limit=1`,
      )
        .then((res) => res.json())
        // @ts-ignore
        .then((res) => res.features.at(0));

      // console.log({ location })

      await sql`UPDATE "User" SET location = ${location} WHERE id = ${user.id}`;
    } catch (error) {
      console.error({ error });
    }
  }),
);

console.log(results.length - results.filter((r) => r.status === "rejected").length + " / " + results.length)

sql.end({ timeout: 5 });
