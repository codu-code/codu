---
title: "Ternary operator in Javascript"
author: "Praveen Kumar"
description: "We all have that model in our mind that a variable is a box containing some value e.g. let a contains 10. Let me ask you a simple question. What is a variable? You might have answered that variable is a box in memory that holds some value and you have pictured something as below in your mind."
keywords: "Javascript, unboxing, variable, box, memory, value"
tags:
  - JAVASCRIPT
date: "2021-09-30"
---

This is the situation that you can never avoid as a developer. Assigning value to a variable based on a condition.

So in this article, we will have a look at different approaches you can take for doing this trivial looking task(Trust me sometimes it makes you cry).

Assume that you are working in a pizzeria and you have to take care of veg and non-veg orders, and you cannot make mistakes. So if a vegetarian person orders a pizza you need to add mushrooms as the topping and for a non-veg order, you add chicken.

Let us write some code that will help us to make that decision.

```js
let isVeg = true;
let topping = null;
if (isVeg) {
  topping = "mushroom";
} else {
  topping = "chicken";
}
console.log(`You ordered a pizza with ${topping} as a topping`);
// You ordered a pizza with mushroom as a topping
```

But notice here you have to initialize the `topping` variable first. It is quite easy to fix that. Have a look at the snippet below

```javascript highlight-line={1,3}
let isVeg = true;
if (isVeg) {
  var topping = "mushroom";
} else {
  var topping = "chicken";
}
console.log(`You ordered a pizza with ${topping} as a topping`);
// You ordered a pizza with mushroom as a topping
```

This solved our problem but also brought all the caveats of using var in our code.
So now the problem is then how to solve both of these problems.....
Hmmm, we should ask our friend `? ternary operator` to help us out.

```js
let isVeg = true;
let topping = isVeg ? "mushroom" : "chicken";
console.log(`You ordered a pizza with ${topping} as a topping`);
// You ordered a pizza with mushroom as a topping
```

Now that looks pretty good and only one line of code to achieve our goal.
Everything looks perfect till now and the customer wants to pay the bills.
But our pizzeria has a special discount for the various member having different badges like gold, silver, diamond and no discount for others. So now you need to do all that conditional logic and assigning adding if-else. quite messy work.
Let me show you how you can break that into small chunks that are easy to read and reuse.

```js
let isVeg = true;
let topping = isVeg ? "mushroom" : "chicken";
console.log(`You ordered a pizza with ${topping} as a topping`);
// You ordered a pizza with mushroom as a topping

// User wants the bill and drinks are free if amount < 15
const drinks = calculateDrinksPrice(2);
const bill = getDiscountedPrice("DIAMOND", 200) + (drinks < 15 ? drinks : 0);
console.log(`You need to pay ${bill} for your order`);

function getDiscountedPrice(badge = "none", amount) {
  switch (badge) {
    case "DIAMOND":
      return amount - amount * 0.2;
    case "GOLD":
      return amount - amount * 0.1;
    case "SILVER":
      return amount - amount * 0.05;
    default:
      return amount;
  }
}

/* If the customer wants some cold drink */
function calculateDrinksPrice(qty) {
  // you can have your own logic for different drinks and prices in here
  return qty * 10;
}
```

You see how easy it becomes to read the code and assign values conditionally by breaking it down into small chunks and using ternary operator for small logic and switch-case for more complex logic.
Hope you l got an understanding of how to write clean code while assigning values dynamically.
