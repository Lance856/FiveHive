import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // Firestore instance
import { useRouter } from "next/navigation";
import { type FirebaseAuthError } from "node_modules/firebase-admin/lib/utils/error";
import { useUser } from "@/components/hooks/UserContext";

export const useAuthHandlers = () => {
  const router = useRouter();
  const { updateUser } = useUser(); // Get the updateUser function

  const getMessageFromCode = (code: string): string | undefined => {
    return code.split("/").pop()?.replaceAll("-", " ");
  };

  const signUpWithEmail = async (
    username: string,
    email: string,
    password: string,
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      const defaultPhotoURL =
        "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";

      await updateProfile(user, {
        displayName: username,
        photoURL: defaultPhotoURL,
      });

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: username,
        photoURL: defaultPhotoURL,
        access: "user",
      });

      router.push("/");
      // Allows time for db to store user, then refreshes page to reload user and replace sign up + login page.
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (e: unknown) {
      const error = e as FirebaseAuthError;

      throw {
        code: error.code,
        message:
          error.message ??
          getMessageFromCode(error.code) ??
          "There was an error in sign up",
      };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Check if user data exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw {
          code: "auth/invalid-email",
        };
      }


      router.push("/");
      await updateUser();
      return userCredential;
    } catch (e: unknown) {
      const error = e as FirebaseAuthError;
      throw {
        code: error.code,
        message:
          error.message ??
          getMessageFromCode(error.code) ??
          "There was an error in login",
      };
    }
  };

  const signUpWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);

      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        access: "user", // Default access level
      });

      router.push("/");
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (e: unknown) {
      const error = e as FirebaseAuthError;
      throw {
        code: error.code,
        message:
          error.message ??
          getMessageFromCode(error.code) ??
          "There was an error signing up with Google",
      };
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user data exists in Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw {
        code: "auth/invalid-email",
      };
    }

    router.push("/");
    await updateUser();
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: unknown) {
      const error = e as FirebaseAuthError;
      throw {
        code: error.code,
        message:
          error.message ??
          getMessageFromCode(error.code) ??
          "An unknown error occurred",
      };
    }
  };

  return {
    signUpWithEmail,
    signInWithEmail,
    signUpWithGoogle,
    signInWithGoogle,
    forgotPassword,
  };
};
