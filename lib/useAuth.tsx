"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth"
import { auth } from "./firebaseAuth"
import { getFullUserProfile, UserProfile } from "./firestore"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  refreshUserProfile: async () => {}
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("ログアウトエラー:", error)
      throw error
    }
  }

  const refreshUserProfile = async () => {
    if (user) {
      try {
        console.log('ユーザープロフィールを更新中...')
        const profile = await getFullUserProfile(user.uid)
        console.log('更新されたプロフィール:', profile)
        setUserProfile(profile)
      } catch (error) {
        console.error("プロフィール更新エラー:", error)
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          const profile = await getFullUserProfile(firebaseUser.uid)
          setUserProfile(profile)
        } catch (error) {
          console.error("プロフィール取得エラー:", error)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
