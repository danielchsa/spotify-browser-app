import { months } from "./modules/months.js";
import { CLIENT_ID, CLIENT_SECRET } from "./modules/creedentials.js";

const form = document.getElementById("frm");
const input = document.getElementById("search");
const results = document.getElementById("songs");

const API_URL = "https://api.spotify.com/v1";

let token = localStorage.getItem("token") || "";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const artist = input.value.trim();
  results.innerHTML = "";
  try {
    if (!artist) return;

    if (!token) {
      await getAccessToken();
    }

    await getArtistID(artist);
    input.value = "";
    input.blur();
  } catch (error) {
    console.log(error);
    input.value = "";
    input.blur();
  }
});

async function getAccessToken() {
  const url = "https://accounts.spotify.com/api/token";

  const response = await fetch(
    `${url}?grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
    {
      method: "Post",
      mode: "cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Something went wrong when obtaining the access token.");
  }
  const { access_token } = await response.json();
  token = access_token;
  localStorage.setItem("token", token);
}

async function getArtistID(name) {
  const response = await fetch(
    `${API_URL}/search?q=${name}&type=artist&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const { artists, error } = await response.json();

  if (error?.status === 401) {
    localStorage.removeItem("token");
    token = "";
    throw new Error(error.message);
  }

  const {
    items: [artist],
  } = artists;

  await findSongs(artist.id);
}

async function findSongs(artistID) {
  try {
    const response = await fetch(
      `${API_URL}/artists/${artistID}/albums?include_groups=single&limit=6`,

      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { items, error } = await response.json();

    if (error?.status === 401) {
      localStorage.removeItem("token");
      token = "";
      throw new Error(error.message);
    }

    generateCards(items);
  } catch (e) {
    console.log(e);
  }
}

function generateCards(songs) {
  songs.forEach(({ name, images, release_date, external_urls }) => {
    const [imageUrl] = images;
    const { spotify: spotifyLink } = external_urls;
    const release = new Date(release_date);
    const date_release = `${
      months[release.getMonth()]
    }, ${release.getFullYear()}`;

    const card = `
    <div class="card">
    <div class="avatar">
      <img
        src=${imageUrl.url}
        alt="Illenium"
      />
    </div>
    <div class="info">
      <div class="details">
        <h3>${name}</h3>
        <span>Release: ${date_release}</span>
      </div>
      <footer>
        <a href=${spotifyLink} target="_blank" class="button listen">
          <i class="ph ph-spotify-logo icon"></i>Listen on Spotify</a
        >
      </footer>
    </div>
  </div>
    `;
    results.innerHTML += card;
  });
}
