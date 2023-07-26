import type { Component } from "solid-js";
import { createSignal } from "solid-js";

import styles from "./App.module.css";

const UPLOAD_URL = import.meta.env.VITE_IMAGE_UPLOAD_URL;

const App: Component = () => {
  const [photoUploaded, setPhotoUploaded] = createSignal(false);

  const uploadPhoto = async (e: SubmitEvent) => {
    e.preventDefault();
    const [file] = (e.target as HTMLFormElement).photo.files;
    if (!file) {
      alert("Please select a file!");
      return;
    }
    if (file.size > 48 * 1024) {
      alert("File is too big. Max size: 48 KB");
      return;
    }
    const email = (e.target as HTMLFormElement).email.value;
    if (!email) {
      alert("Please enter an email!");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("email", email);
    const result = await fetch(UPLOAD_URL, {
      method: "POST",
      body: formData,
    });
    const json = await result.json();
    console.log("result", json);

    setPhotoUploaded(true);
  };

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        {photoUploaded() ?
          <div>Photo uploaded successfully. Check your email soon!</div>
          :
          <div>
            <h1>Upload photo to generate caption!</h1>
            <form onSubmit={uploadPhoto}>
              <div class={styles.formWrapper}>
                <label>
                  Photo:
                  <input
                    class={styles.fileInput}
                    type="file"
                    name="photo"
                    accept="image/png, image/jpeg"
                  />
                </label>
                <label>
                  Email:
                  <input class={styles.emailInput} name="email" type="email" />
                </label>
                <input class={styles.submitButton} type="submit" value="Upload" />
              </div>
            </form>
          </div>
        }
      </header>
    </div>
  );
};

export default App;
