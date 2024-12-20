import { auth, db } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "@/types/user";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

// Cached user state
let cachedUser: User | null = null;
const cacheTimestamp: number | null = null;

// Expiration time in milliseconds (24 hours = 24 * 60 * 60 * 1000)
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

// Function to check if the cache is still valid
const isCacheValid = (): boolean => {
  if (!cacheTimestamp) return false; // No timestamp means cache doesn't exist
  const now = Date.now();
  return now - cacheTimestamp < CACHE_EXPIRATION_TIME;
};

// Fetch only user access from Firestore
export const getUserAccess = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (user) {
    const userAccessDoc = await getDoc(doc(db, "users", user.uid));
    if (userAccessDoc.exists()) {
      const accessLevel = userAccessDoc.get("access") as string; // Fetch only the "access" field
      return accessLevel; // Return the access level
    }
  }
  return null;
};

export const getUser = async (): Promise<User | null> => {
  if (cachedUser && isCacheValid()) {
    // Update the access property if the user is already cached
    const newAccess = await getUserAccess();
    if (
      newAccess === "admin" ||
      newAccess === "member" ||
      newAccess === "user"
    ) {
      cachedUser.access = newAccess || cachedUser.access;
      return cachedUser;
    }
  }

  // No cached user, call original function
  return new Promise<User | null>((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(
      (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser === null) {
          resolve(null);
          unsubscribe();
          return;
        }

        // Define the async function inside the synchronous callback
        const fetchUserData = async () => {
          try {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              const mappedUser: User = {
                uid: firebaseUser.uid,
                displayName:
                  userData.displayName ?? firebaseUser.displayName ?? "",
                email: userData.email ?? firebaseUser.email ?? "",
                photoURL:
                  userData.photoURL ?? firebaseUser.photoURL ?? undefined,
                access: userData.access ?? "user",
              };

              // Cache the user object
              cachedUser = mappedUser;

              // Return the mapped user
              resolve(mappedUser);
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          } finally {
            unsubscribe();
          }
        };

        // Call the async function
        fetchUserData().catch((error) => {
          reject(error);
          unsubscribe();
        });
      },
      reject,
    );
  });
};

// Fetch all users from Firestore
let users: User[] = [];

export const getAllUsers = async (): Promise<User[]> => {
  if (users.length > 0) {
    return users;
  }

  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    const usersList: User[] = usersSnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...(doc.data() as Omit<User, "uid">),
    }));
    users = usersList;
    return usersList;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Update user role in Firestore
export const updateUserRole = async (
  authUser: User | null,
  uid: string,
  newRole: "member" | "user",
): Promise<void> => {
  if (!authUser || authUser.access !== "admin") {
    return;
  }

  try {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
      access: newRole,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};
