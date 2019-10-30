const select = document.getElementById('breeds');
const card = document.querySelector('.card');
const form = document.querySelector('form');
const displayCount = 12;
const nationality = "us";
const randomUserAPI = `https://randomuser.me/api/?results=${displayCount}&nat=${nationality}&format=pretty`;

// ------------------------------------------
//  FETCH FUNCTIONS
// ------------------------------------------
function fetchData(api) {
  return fetch(api)
    .then(result => result.json())
    .catch(error => console.log("Error fetching users: ", error));
}

let usersPromise = fetchData(randomUserAPI).then(data =>
  displayUsers(data.results)
);

// ------------------------------------------
//  Build and Build Page Methods
// ------------------------------------------

// creates the searchbar
function createSearchBar() {
  const form = document.createElement("form");
  form.action = "#";
  form.method = "get";

  form.innerHTML = `
    <input type="search" id="search-input" class="search-input" placeholder="Search...">
    <input type="submit" value="&#x1F50D;" id="serach-submit" class="search-submit">
  `;

  return form;
}


addSearchBar();

// expects: users array from random user api
// adds user cards to the dom
function displayUsers(users) {
  const galleryDiv = document.getElementById("gallery");

  for (let i = 0; i < users.length; i++) {
    galleryDiv.appendChild(createUserCard(users[i]));
  }

  return users;
}


// expects: user object from random user api
// returns: div dom fragment with user info and thumbnail
function createUserCard(user) {
  const cardDiv = document.createElement("div");
  cardDiv.classList.add("card");
  cardDiv.dataset.uuid = user.login.uuid;
  cardDiv.appendChild(createThumbnail(user));
  cardDiv.appendChild(createInfo(user));

  return cardDiv;
}

// expects: user object from random user api
// returns: div dom fragment with user image thumbnail
function createThumbnail(user) {
  const imgDiv = document.createElement("div");
  imgDiv.classList.add("card-img-container");
  const img = document.createElement("img");
  img.classList.add("card-img");
  imgDiv.classList.add("img-hover-zoom--colorize");
  img.src = user.picture.large;
  img.alt = `picture of ${user.name.first} ${user.name.last}`;
  imgDiv.appendChild(img);

  return imgDiv;
}


// expects: user object from random user api
// returns: div dom fragment with user information
function createInfo(user) {
  const infoDiv = document.createElement("div");
  infoDiv.classList.add("card-info-container");

  infoDiv.innerHTML = `
    <h3 id="${user.name.first}-${user.name.last}" class="card-name cap">${
    user.name.first
  } ${user.name.last}</h3>
    <p class="card-text">${user.email}</p>
    <p class="card-text cap">${user.location.city}, ${user.location.state}</p>
  `;

  return infoDiv;
}

function displayModal(user) {
  const modal = createModalContainer(user);
  // remove modal when modal-close-btn is clicked
  
  document.querySelector("body").appendChild(modal);
}

// expects: user object
// returns: div dom fragment of the complete modal
function createModalContainer(user) {
  const modalContainerDiv = document.createElement("div");
  modalContainerDiv.classList.add("modal-container");
  modalContainerDiv.dataset.uuid = user.login.uuid;
  modalContainerDiv.appendChild(createModal(user));
  modalContainerDiv.appendChild(createModalButtonContainer(user.login.uuid));

  return modalContainerDiv;
}

// expects: user object
// returns: div dom fragment with user info and picture and close button
function createModal(user) {
  const modalDiv = document.createElement("div");
  modalDiv.classList.add("modal");
  modalDiv.appendChild(createCloseBtn());
  modalDiv.appendChild(createInfoContainer(user));
  modalDiv.addEventListener("click", e => {
    removeModal();
  });
  return modalDiv;
}

// returns: close button
function createCloseBtn() {
  const button = document.createElement("button");
  const strong = document.createElement("strong");
  const X = document.createTextNode("X");
  strong.appendChild(X);
  button.appendChild(strong);
  button.type = "button";
  button.id = "modal-close-btn";
  button.classList.add("modal-close-btn");

  return button;
}

// expects: user object
// returns: div dom fragment with user info and picture
function createInfoContainer(user) {
  const infoContainer = document.createElement("div");
  infoContainer.classList.add("modal-info-container");
  const birthday = new Date(user.dob.date).toLocaleDateString();

  infoContainer.innerHTML = `
    <img class="modal-img" src="${user.picture.large}" alt="picture of ${
    user.name.first
  } ${user.name.last}">
    <h3 id="name" class="modal-name cap">${user.name.first} ${
    user.name.last
  }</h3>
    <p class="modal-text">${user.email}</p>
    <p class="modal-text cap">${user.location.state}</p>
    <hr>
    <p class="modal-text">${user.phone}</p>
    <p class="modal-text cap">${user.location.street.number} ${user.location.street.name}</p>
    <p class="modal-text cap"> ${user.location.city}, ${abbrvState(user.location.state)} ${user.location.postcode}</p>
    <p class="modal-text">Birthday: ${birthday}</p>
  `;

  return infoContainer;
}

// expects: a user uuid
// returns: div dom fragment with a container for the prev
// and next buttons
function createModalButtonContainer(uuid) {
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("modal-btn-container");

  const prevButton = createPrevButton(uuid);
  const nextButton = createNextButton(uuid);

  if (prevButton) {
    buttonContainer.appendChild(prevButton);
  }

  if (nextButton) {
    buttonContainer.appendChild(nextButton);
  }

  return buttonContainer;
}

// expects: a user uuid
// returns: a button dom fragment for the prev button
// if the currently displayed user is not the first user
function createPrevButton(uuid) {
  const userIndex = getUserIndexFromUUID(uuid);

  if (userIndex > 0) {
    const button = document.createElement("button");
    button.type = "button";
    button.id = "modal-prev";
    button.classList.add("modal-prev");
    button.classList.add("btn");
    button.appendChild(document.createTextNode("Prev"));

    return button;
  }

  return undefined;
}

// expects: a user uuid
// returns: a button dom fragment for the next button
// if the currently displayed user is not the last user
function createNextButton(uuid) {
  const userIndex = getUserIndexFromUUID(uuid);
  const numUsers = getNumUsers();

  if (userIndex < numUsers - 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.id = "modal-next";
    button.classList.add("modal-next");
    button.classList.add("btn");
    button.appendChild(document.createTextNode("Next"));

    return button;
  }

  return undefined;
}

// expects: a promise with user objects and a boolean
// to indicate what user should be displayed: true = previous User
// false = next User
function cycleModal(usersPromise, prev) {
  const userDelta = prev ? -1 : 1;

  const currentModalUUID = getUserUUIDFromModal();
  const currentUserIndex = getUserIndexFromUUID(currentModalUUID);
  const userUUIDS = getUserUUIDsfromCards();
  const cycleUserUUID = userUUIDS[currentUserIndex + userDelta];
  const cycleUser = getUserFromUUID(usersPromise, cycleUserUUID);

  removeModal();
  cycleUser.then(user => displayModal(user));
}

// removes modal from the dom
function removeModal() {
  document.querySelector(".modal-container").remove();
}

// -----------------------------------------------------------
// SEARCH FUNCTIONS
// -----------------------------------------------------------

// appends the searchbar to the document
function addSearchBar() {
  document.querySelector(".search-container").appendChild(createSearchBar());
}


// expects: promise with user object array, a string to search for
// removes all users from document and displays those, where either
// first name or last name matchtes searchString
function displayFilteredUsers(users, searchString) {
  removeUsers();

  users
    .then(users => filterUsers(users, searchString.toLowerCase()))
    .then(users => displayUsers(users));
}



// expects: user object array, a string to search for
// returns: new array with all users, where either first or last
// name matches searchString
function filterUsers(users, searchString) {
  const userarray = users;

  function nameCheck(user){
    const fullname = user.name.first.toLowerCase() + ' ' + user.name.last.toLowerCase();

    return fullname.includes(searchString.toLowerCase());;
  }

  return users.filter(nameCheck);
  //  user =>
  //  user.name.first.toLowerCase().includes(searchString.toLowerCase) ||
  //  user.name.last.toLowerCase().includes(searchString.toLowerCase)
  //);
}

// remove all children of the gallery div
function removeUsers() {
  const gallery = document.getElementById("gallery");
  while (gallery.firstChild) {
    gallery.firstChild.remove();
  }
}

// -----------------------------------------------------------
// EVENT HANDLERS
// -----------------------------------------------------------

// display modal when employee card is clicked
document.getElementById("gallery").addEventListener("click", e => {
  if (e.target.id !== "gallery") {
    const userUUID = getUserUUIDFromCard(e.target);
    const user = getUserFromUUID(usersPromise, userUUID);
    user.then(user => displayModal(user));
  }
});



// remove modal when modal-close-btn is clicked
document.querySelector("body").addEventListener("click", e => {
if (e.target.id === "modal-prev") {
    cycleModal(usersPromise, true);
  } else if (e.target.id === "modal-next") {
    cycleModal(usersPromise, false);
  }
});

// filter users when search form is submitted
document
  .querySelector(".search-container form")
  .addEventListener("submit", e => {
    displayFilteredUsers(usersPromise, e.target.firstElementChild.value);
  });

// filter users when text is entered into search input
document.getElementById("search-input").addEventListener("keyup", e => {
  displayFilteredUsers(usersPromise, e.target.value);
});

// -----------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------

// expects: any dom node inside a user card div
// returns: uuid of the clicked user
function getUserUUIDFromCard(target) {
  let cardDiv = target;

  while (!cardDiv.classList.contains("card")) {
    cardDiv = cardDiv.parentNode;
  }

  return cardDiv.dataset.uuid;
}

// expects: promise with users array and valid uuid
// returns: promise with user object
function getUserFromUUID(users, uuid) {
  const theUsers = users;
  return users.then(users => users.find(user => user.login.uuid === uuid));
}

// returns: an array of uuids from all users that are currently displayed
function getUserUUIDsfromCards() {
  const cards = document.querySelectorAll(".card");

  return [...cards].map(card => card.dataset.uuid);
}

// returns: the uuid of the user currently displayed in the modal
function getUserUUIDFromModal() {
  return document.querySelector(".modal-container").dataset.uuid;
}

// expects: a user uuid
// returns: the index of the user matching the uuid
// relative to all users currently displayed as cards
function getUserIndexFromUUID(uuid) {
  const userUUIDs = getUserUUIDsfromCards();

  return userUUIDs.findIndex(arrUUID => arrUUID === uuid);
}

// returns: the number of users currently displayed
function getNumUsers() {
  return getUserUUIDsfromCards().length;
}
// ------------------------------------------
//  EVENT LISTENERS
// ------------------------------------------



// ------------------------------------------
//  HELPER FUNCTIONS
// ------------------------------------------

function checkStatus(response) {
  if (response.ok) {
    return Promise.resolve(response);
  } else {
    return Promise.reject(new Error(response.statusText));
  }
}


const states = [
  { state: 'Arizona', abbrv: 'AZ'},
  { state: 'Alabama', abbrv: 'AL'},
  { state: 'Alaska', abbrv: 'AK'},
  { state: 'Arizona', abbrv: 'AZ'},
  { state: 'Arkansas', abbrv: 'AR'},
  { state: 'California', abbrv: 'CA'},
  { state: 'Colorado', abbrv: 'CO'},
  { state: 'Connecticut', abbrv: 'CT'},
  { state: 'Delaware', abbrv: 'DE'},
  { state: 'Florida', abbrv: 'FL'},
  { state: 'Georgia', abbrv: 'GA'},
  { state: 'Hawaii', abbrv: 'HI'},
  { state: 'Idaho', abbrv: 'ID'},
  { state: 'Illinois', abbrv: 'IL'},
  { state: 'Indiana', abbrv: 'IN'},
  { state: 'Iowa', abbrv: 'IA'},
  { state: 'Kansas', abbrv: 'KS'},
  { state: 'Kentucky', abbrv: 'KY'},
  { state: 'Kentucky', abbrv: 'KY'},
  { state: 'Louisiana', abbrv: 'LA'},
  { state: 'Maine', abbrv: 'ME'},
  { state: 'Maryland', abbrv: 'MD'},
  { state: 'Massachusetts', abbrv: 'MA'},
  { state: 'Michigan', abbrv: 'MI'},
  { state: 'Minnesota', abbrv: 'MN'},
  { state: 'Mississippi', abbrv: 'MS'},
  { state: 'Missouri', abbrv: 'MO'},
  { state: 'Montana', abbrv: 'MT'},
  { state: 'Nebraska', abbrv: 'NE'},
  { state: 'Nevada', abbrv: 'NV'},
  { state: 'New Hampshire', abbrv: 'NH'},
  { state: 'New Jersey', abbrv: 'NJ'},
  { state: 'New Mexico', abbrv: 'NM'},
  { state: 'New York', abbrv: 'NY'},
  { state: 'North Carolina', abbrv: 'NC'},
  { state: 'North Dakota', abbrv: 'ND'},
  { state: 'Ohio', abbrv: 'OH'},
  { state: 'Oklahoma', abbrv: 'OK'},
  { state: 'Oregon', abbrv: 'OR'},
  { state: 'Pennsylvania', abbrv: 'PA'},
  { state: 'Rhode Island', abbrv: 'RI'},
  { state: 'South Carolina', abbrv: 'SC'},
  { state: 'South Dakota', abbrv: 'SD'},
  { state: 'Tennessee', abbrv: 'TN'},
  { state: 'Texas', abbrv: 'TX'},
  { state: 'Utah', abbrv: 'UT'},
  { state: 'Vermont', abbrv: 'VT'},
  { state: 'Virginia', abbrv: 'VA'},
  { state: 'Washington', abbrv: 'WA'},
  { state: 'West Virginia', abbrv: 'WV'},
  { state: 'Wisconsin', abbrv: 'WI'},
  { state: 'Wyoming', abbrv: 'WY'}
];

abbrvState = state => {
  for(key of states){
    if(key.state.toLowerCase() === state.toLowerCase()){
      return key.abbrv;
    }
  }
};