import { test } from "tap"
import { foo } from "../src"

test("foo", async (t) => {
	t.match(foo(), 1)
})
