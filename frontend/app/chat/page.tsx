"use client";
import React, { useEffect } from 'react'
import { useAppData } from '../context/AppContext';
import { useRouter } from 'next/navigation';
import Loadable from 'next/dist/shared/lib/loadable.shared-runtime';
import Loading from '../components/Loading';

const ChatApp = () => {
  const {loading , isAuth} = useAppData();

  const router = useRouter();

  useEffect(() => {
    if(!loading && !isAuth){
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  if(loading)return <Loading />
  return (
    <div>Chatpage</div>
  )
}

export default ChatApp