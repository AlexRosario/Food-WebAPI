const viewer = document.getElementById("viewer");
const faves = document.getElementById("faves");
const alphabet = document.getElementById("alphabet");
const allButton = document.getElementById("all");
const backButton = document.getElementById("Previous");
const nextButton = document.getElementById("Next");
const sortBtn = document.querySelectorAll(".sortBtn");
let mealItems = [];
let foodArr = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let currentPage = 0;
const pageSize = 9;
let currentIndex = 0;

async function fetchEntireList() {
	try {
		for (let i = 0; i < 26; i++) {
			const letter = String.fromCharCode(97 + i);
			const response = await fetch(
				`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`
			);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			if (data.meals) {
				foodArr.push(...data.meals);
			}
		}
	} catch (error) {
		console.error("Error fetching food items:", error);
		viewer.textContent = "Failed to fetch meals";
	}
}

const createItems = (mealList) => {
	let counter = 0;

	for (const meal of mealList) {
		const mealItem = document.createElement("div");
		const mealDivTop = document.createElement("div");
		const mealDivBottom = document.createElement("div");

		const recipePic = document.createElement("img");
		const recipeLink = document.createElement("a");
		const recipeC = document.createElement("div");
		const favorite = document.createElement("i");

		mealItem.appendChild(mealDivTop);
		mealItem.appendChild(mealDivBottom);
		mealDivTop.appendChild(recipePic);
		mealDivTop.appendChild(favorite);
		mealDivTop.appendChild(recipeC);
		mealDivBottom.appendChild(recipeLink);
		mealItem.appendChild(mealDivTop);
		mealItem.appendChild(mealDivBottom);

		mealItem.className = "meal";
		mealItem.setAttribute("data-letter", meal.strMeal.charAt(0).toLowerCase());
		mealItem.id = counter;
		mealDivTop.className = "meal-top";
		mealDivBottom.className = "meal-bottom";
		recipeLink.className = "recipe";
		recipePic.className = "recipe-pic";
		recipeC.className = "recipe-country";
		favorite.className = "fa-regular fa-heart";

		recipeLink.textContent = meal.strMeal;
		recipeLink.href = meal.strSource;
		recipeC.textContent = meal.strArea;
		recipePic.src = meal.strMealThumb;
		mealItems.push(mealItem);

		counter++;
	}

	return mealItems;
};

const placeInViewer = (mealList) => {
	let counter = 0;

	for (let i = 0; i < mealItems.length; i++) {
		const mealItem = mealItems[i];
		const recipePic = mealItem.querySelector(".recipe-pic");
		const favorite = mealItem.querySelector(".fa-heart");
		const meal = mealList[i];

		if (!faves.contains(mealItem)) {
			viewer.appendChild(mealItem);
			counter++;
		} else {
			faves.appendChild(mealItem);
			counter++;
		}

		recipePic.addEventListener("click", () => {
			alert(meal.strInstructions);
		});

		favorite.addEventListener("click", () => {
			toggleFavorite(mealItem);
		});
	}
};

// sum value by country
const populateDropdown = () => {
	const countrySelect = document.getElementById("country");
	const countryCounts = totalByCountry();
	const defaultOption = document.createElement("option");
	const countryCount = document.getElementById("countryCount");

	defaultOption.value = "All";
	defaultOption.textContent = "All";
	countrySelect.appendChild(defaultOption);

	for (const country in countryCounts) {
		const option = document.createElement("option");
		option.value = country;
		option.textContent = country;
		countrySelect.appendChild(option);
	}
	countrySelect.value = "All";
	countryCount.textContent = foodArr.length;
};

const totalByCountry = () => {
	return foodArr.reduce((accArr, foodItem) => {
		accArr[foodItem.strArea] = (accArr[foodItem.strArea] || 0) + 1;
		return accArr;
	}, {});
};

document.getElementById("country").addEventListener("change", (event) => {
	const selectedCountry = event.target.value;
	const countryCount = document.getElementById("countryCount");
	const counts = totalByCountry();

	if (selectedCountry === "All") {
		countryCount.textContent = foodArr.length;
	} else {
		countryCount.textContent = counts[selectedCountry] || "0";
	}
});

//sort functions for dom and array
const sortItems = (direction, location) => {
	let meals = location.getElementsByClassName("meal");
	let mealsArray = Array.from(meals);

	mealsArray.sort((a, b) => {
		let [aText, bText] = [a, b].map((item) =>
			item.querySelector(".recipe").textContent.toLowerCase()
		);
		const arr = direction === "asc" ? [aText, bText] : [bText, aText];
		return arr[0].localeCompare(arr[1]);
		/*
		let aText = a.querySelector(".recipe").textContent.toLowerCase();
		let bText = b.querySelector(".recipe").textContent.toLowerCase();

		if (direction === "asc") {
			return aText.localeCompare(bText);
		} else {
			return bText.localeCompare(aText);
		}*/
	});

	location.innerHTML = "";
	mealsArray.forEach((meal) => location.appendChild(meal));
};

sortBtn.forEach((button) => {
	button.addEventListener("click", () => {
		const sortDirection = button.dataset.sortdir;
		const slideContainer = button.parentNode.id;
		let location;
		if (slideContainer === "viewer-list") {
			location = document.getElementById("viewer");
		} else if (slideContainer === "faves-list") {
			location = document.getElementById("faves");
		}
		sortItems(sortDirection, location);
	});
});

const sortArray = (arr) => {
	arr.sort((a, b) => {
		let aText = a.strMeal.toLowerCase();
		let bText = b.strMeal.toLowerCase();
		return aText.localeCompare(bText);
	});
};

//move items to and from Favorites

const toggleFavorite = (mealElement) => {
	const favoriteIcon = mealElement.querySelector(".fa-heart");
	const meals = [...viewer.querySelectorAll(".meal")];
	const mealId = mealElement.id;
	const refElement = meals.find((el) => parseInt(el.id) > parseInt(mealId));
	const isInViewer = viewer.contains(mealElement);
	const isInFaves = faves.contains(mealElement);

	if (isInFaves) {
		favoriteIcon.style.color = "black";
		if (refElement) {
			viewer.insertBefore(mealElement, refElement);
		} else {
			viewer.appendChild(mealElement);
		}
		removeFromFavorites(mealElement);
	} else if (isInViewer) {
		favoriteIcon.style.color = "red";
		faves.appendChild(mealElement);
		addToFavorites(mealElement);
	}
};

function addToFavorites(meal) {
	if (!favorites.includes(meal.id)) {
		favorites.push(meal);
		console.log(favorites);
		localStorage.setItem("favorites", JSON.stringify(favorites));
	}
}

function removeFromFavorites(meal) {
	favorites = favorites.filter((favId) => favId !== meal);
	localStorage.setItem("favorites", JSON.stringify(favorites));
}

//More fun functions for buttons

allButton.addEventListener("click", () => {
	mealItems.forEach((mealItem) => {
		mealItem.style.display = "block";
	});
});

backButton.addEventListener("click", () => {
	if (currentPage > 0) {
		currentPage--;
		const startIndex = currentPage * pageSize;
		const endIndex = startIndex + pageSize;

		mealItems.forEach((mealItem, index) => {
			if (index >= startIndex && index <= endIndex) {
				mealItem.style.display = "block";
			} else {
				if (viewer.contains(mealItem)) {
					mealItem.style.display = "none";
				}
			}
		});
	}
});

nextButton.addEventListener("click", () => {
	const maxPage = Math.ceil(foodArr.length / pageSize) - 1; // Calculate the max page index
	if (currentPage < maxPage) {
		currentPage++;
		const startIndex = currentPage * pageSize;
		const endIndex = Math.min(startIndex + pageSize, foodArr.length);

		mealItems.forEach((mealItem, index) => {
			if (index >= startIndex && index < endIndex) {
				mealItem.style.display = "block";
			} else {
				if (viewer.contains(mealItem)) {
					mealItem.style.display = "none";
				}
			}
		});
	}
});

const makeIndex = () => {
	const alphabet = document.getElementById("alphabet");

	// Attach event listener to the parent
	alphabet.addEventListener("click", (event) => {
		// Check if the clicked element is a button
		if (event.target.tagName === "BUTTON") {
			const letter = event.target.innerText;
			displayItemsByLetter(letter);
		}
	});

	for (let i = 1; i <= 26; i++) {
		const indexAt = document.createElement("button");
		const letter = String.fromCharCode(64 + i).toLowerCase();

		indexAt.innerHTML = letter;

		// No need to add individual event listeners
		alphabet.appendChild(indexAt);
	}
};

const displayItemsByLetter = (letter) => {
	let counter = 0;
	let noMeals =
		document.querySelector(".noMeals") || document.createElement("p");
	noMeals.className = "noMeals";

	mealItems.forEach((mealItem) => {
		if (mealItem.dataset.letter === letter) {
			mealItem.style.display = "block";
			counter++;
		} else if (viewer.contains(mealItem)) {
			mealItem.style.display = "none";
		}
	});

	if (counter === 0 && !viewer.contains(noMeals)) {
		noMeals.innerHTML = `There are no meals under ${letter}`;
		viewer.appendChild(noMeals);
	} else if (counter > 0 && viewer.contains(noMeals)) {
		viewer.removeChild(noMeals);
	}

	const firstLetterItem = mealItems.find(
		(mealItem) => mealItem.dataset.letter === letter
	);
	currentPage = mealItems.indexOf(firstLetterItem) / 9; //divide by 9 to adjust for page size variable
};

document.addEventListener("DOMContentLoaded", async (event) => {
	await fetchEntireList();
	favorites = JSON.parse(localStorage.getItem("favorites")) || [];
	sortArray(foodArr);
	makeIndex();
	mealItems = createItems(foodArr);
	placeInViewer(foodArr);
	populateDropdown();
});
