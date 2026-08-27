import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface NewTeam {
  id: string;
  name: string;
  shortName: string;
  players: { id: string; userId: string; fullName: string; position: string; jerseyNumber: number }[];
}

const NEW_TEAMS: NewTeam[] = [
  {
    id: "team-kanaya", name: "الكانيلات", shortName: "كن",
    players: [
      { id: "p-ky-01", userId: "u-ky-01", fullName: "مصطفى ناصر", position: "FORWARD", jerseyNumber: 9 },
      { id: "p-ky-02", userId: "u-ky-02", fullName: "محمد سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { id: "p-ky-03", userId: "u-ky-03", fullName: "أحمد حسين", position: "DEFENDER", jerseyNumber: 4 },
      { id: "p-ky-04", userId: "u-ky-04", fullName: "حسن طارق", position: "FORWARD", jerseyNumber: 11 },
      { id: "p-ky-05", userId: "u-ky-05", fullName: "خالد وليد", position: "MIDFIELDER", jerseyNumber: 8 },
      { id: "p-ky-06", userId: "u-ky-06", fullName: "عمر ناصر", position: "DEFENDER", jerseyNumber: 3 },
      { id: "p-ky-07", userId: "u-ky-07", fullName: "ياسر أحمد", position: "GOALKEEPER", jerseyNumber: 1 },
      { id: "p-ky-08", userId: "u-ky-08", fullName: "سامي حسين", position: "MIDFIELDER", jerseyNumber: 14 },
      { id: "p-ky-09", userId: "u-ky-09", fullName: "طارق محمد", position: "DEFENDER", jerseyNumber: 5 },
      { id: "p-ky-10", userId: "u-ky-10", fullName: "هاني سعيد", position: "FORWARD", jerseyNumber: 17 },
      { id: "p-ky-11", userId: "u-ky-11", fullName: "رامي أحمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { id: "p-ky-12", userId: "u-ky-12", fullName: "نبيل حسين", position: "DEFENDER", jerseyNumber: 2 },
      { id: "p-ky-13", userId: "u-ky-13", fullName: "أسامة طارق", position: "FORWARD", jerseyNumber: 19 },
      { id: "p-ky-14", userId: "u-ky-14", fullName: "ماجد وليد", position: "MIDFIELDER", jerseyNumber: 15 },
      { id: "p-ky-15", userId: "u-ky-15", fullName: "كريم ناصر", position: "DEFENDER", jerseyNumber: 20 },
      { id: "p-ky-16", userId: "u-ky-16", fullName: "finaly عادل", position: "GOALKEEPER", jerseyNumber: 22 },
      { id: "p-ky-17", userId: "u-ky-17", fullName: "عمر سعيد", position: "FORWARD", jerseyNumber: 18 },
      { id: "p-ky-18", userId: "u-ky-18", fullName: "كريم حسين", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    id: "team-gomrok", name: "الجمرك", shortName: "جر",
    players: [
      { id: "p-gr-01", userId: "u-gr-01", fullName: "إبراهيم حسين", position: "FORWARD", jerseyNumber: 9 },
      { id: "p-gr-02", userId: "u-gr-02", fullName: "مصطفى أحمد", position: "MIDFIELDER", jerseyNumber: 7 },
      { id: "p-gr-03", userId: "u-gr-03", fullName: "محمد طارق", position: "FORWARD", jerseyNumber: 11 },
      { id: "p-gr-04", userId: "u-gr-04", fullName: "أحمد سعيد", position: "DEFENDER", jerseyNumber: 4 },
      { id: "p-gr-05", userId: "u-gr-05", fullName: "خالد ناصر", position: "MIDFIELDER", jerseyNumber: 8 },
      { id: "p-gr-06", userId: "u-gr-06", fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { id: "p-gr-07", userId: "u-gr-07", fullName: "finaly إبراهيم", position: "GOALKEEPER", jerseyNumber: 1 },
      { id: "p-gr-08", userId: "u-gr-08", fullName: "عمر حسين", position: "MIDFIELDER", jerseyNumber: 14 },
      { id: "p-gr-09", userId: "u-gr-09", fullName: "ياسر ناصر", position: "DEFENDER", jerseyNumber: 5 },
      { id: "p-gr-10", userId: "u-gr-10", fullName: "سامي أحمد", position: "FORWARD", jerseyNumber: 17 },
      { id: "p-gr-11", userId: "u-gr-11", fullName: "طارق سعيد", position: "MIDFIELDER", jerseyNumber: 10 },
      { id: "p-gr-12", userId: "u-gr-12", fullName: "هاني طارق", position: "DEFENDER", jerseyNumber: 2 },
      { id: "p-gr-13", userId: "u-gr-13", fullName: "رامي حسين", position: "FORWARD", jerseyNumber: 19 },
      { id: "p-gr-14", userId: "u-gr-14", fullName: "نبيل أحمد", position: "MIDFIELDER", jerseyNumber: 15 },
      { id: "p-gr-15", userId: "u-gr-15", fullName: "أسامة سعيد", position: "DEFENDER", jerseyNumber: 20 },
      { id: "p-gr-16", userId: "u-gr-16", fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { id: "p-gr-17", userId: "u-gr-17", fullName: "ماجد ناصر", position: "FORWARD", jerseyNumber: 18 },
      { id: "p-gr-18", userId: "u-gr-18", fullName: "كريم وليد", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    id: "team-bahari", name: "البحري", shortName: "بح",
    players: [
      { id: "p-bh-01", userId: "u-bh-01", fullName: "ياسر عادل", position: "FORWARD", jerseyNumber: 9 },
      { id: "p-bh-02", userId: "u-bh-02", fullName: "هشام سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { id: "p-bh-03", userId: "u-bh-03", fullName: "محمد ناصر", position: "DEFENDER", jerseyNumber: 4 },
      { id: "p-bh-04", userId: "u-bh-04", fullName: "أحمد حسين", position: "FORWARD", jerseyNumber: 11 },
      { id: "p-bh-05", userId: "u-bh-05", fullName: "خالد طارق", position: "MIDFIELDER", jerseyNumber: 8 },
      { id: "p-bh-06", userId: "u-bh-06", fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { id: "p-bh-07", userId: "u-bh-07", fullName: "finaly ياسر", position: "GOALKEEPER", jerseyNumber: 1 },
      { id: "p-bh-08", userId: "u-bh-08", fullName: "عمر أحمد", position: "MIDFIELDER", jerseyNumber: 14 },
      { id: "p-bh-09", userId: "u-bh-09", fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { id: "p-bh-10", userId: "u-bh-10", fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { id: "p-bh-11", userId: "u-bh-11", fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { id: "p-bh-12", userId: "u-bh-12", fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { id: "p-bh-13", userId: "u-bh-13", fullName: "رامي أحمد", position: "FORWARD", jerseyNumber: 19 },
      { id: "p-bh-14", userId: "u-bh-14", fullName: "نبيل حسين", position: "MIDFIELDER", jerseyNumber: 15 },
      { id: "p-bh-15", userId: "u-bh-15", fullName: "أسامة طارق", position: "DEFENDER", jerseyNumber: 20 },
      { id: "p-bh-16", userId: "u-bh-16", fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { id: "p-bh-17", userId: "u-bh-17", fullName: "ماجد ناصر", position: "FORWARD", jerseyNumber: 18 },
      { id: "p-bh-18", userId: "u-bh-18", fullName: "كريم سعيد", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    id: "team-wardian", name: "الورديان", shortName: "ور",
    players: [
      { id: "p-wd-01", userId: "u-wd-01", fullName: "ياسر عادل", position: "FORWARD", jerseyNumber: 9 },
      { id: "p-wd-02", userId: "u-wd-02", fullName: "هشام سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { id: "p-wd-03", userId: "u-wd-03", fullName: "محمد ناصر", position: "DEFENDER", jerseyNumber: 4 },
      { id: "p-wd-04", userId: "u-wd-04", fullName: "أحمد حسين", position: "FORWARD", jerseyNumber: 11 },
      { id: "p-wd-05", userId: "u-wd-05", fullName: "خالد طارق", position: "MIDFIELDER", jerseyNumber: 8 },
      { id: "p-wd-06", userId: "u-wd-06", fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { id: "p-wd-07", userId: "u-wd-07", fullName: "finaly ياسر", position: "GOALKEEPER", jerseyNumber: 1 },
      { id: "p-wd-08", userId: "u-wd-08", fullName: "عمر أحمد", position: "MIDFIELDER", jerseyNumber: 14 },
      { id: "p-wd-09", userId: "u-wd-09", fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { id: "p-wd-10", userId: "u-wd-10", fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { id: "p-wd-11", userId: "u-wd-11", fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { id: "p-wd-12", userId: "u-wd-12", fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { id: "p-wd-13", userId: "u-wd-13", fullName: "رامي أحمد", position: "FORWARD", jerseyNumber: 19 },
      { id: "p-wd-14", userId: "u-wd-14", fullName: "نبيل حسين", position: "MIDFIELDER", jerseyNumber: 15 },
      { id: "p-wd-15", userId: "u-wd-15", fullName: "أسامة أحمد", position: "DEFENDER", jerseyNumber: 20 },
      { id: "p-wd-16", userId: "u-wd-16", fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { id: "p-wd-17", userId: "u-wd-17", fullName: "ماجد طارق", position: "FORWARD", jerseyNumber: 18 },
      { id: "p-wd-18", userId: "u-wd-18", fullName: "كريم حسين", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    id: "team-azmout", name: "العزموط", shortName: "عز",
    players: [
      { id: "p-az-01", userId: "u-az-01", fullName: "إبراهيم ناصر", position: "FORWARD", jerseyNumber: 9 },
      { id: "p-az-02", userId: "u-az-02", fullName: "مصطفى سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { id: "p-az-03", userId: "u-az-03", fullName: "محمد حسين", position: "DEFENDER", jerseyNumber: 4 },
      { id: "p-az-04", userId: "u-az-04", fullName: "أحمد طارق", position: "FORWARD", jerseyNumber: 11 },
      { id: "p-az-05", userId: "u-az-05", fullName: "خالد وليد", position: "MIDFIELDER", jerseyNumber: 8 },
      { id: "p-az-06", userId: "u-az-06", fullName: "حسن أحمد", position: "DEFENDER", jerseyNumber: 3 },
      { id: "p-az-07", userId: "u-az-07", fullName: "finaly إبراهيم", position: "GOALKEEPER", jerseyNumber: 1 },
      { id: "p-az-08", userId: "u-az-08", fullName: "عمر ناصر", position: "MIDFIELDER", jerseyNumber: 14 },
      { id: "p-az-09", userId: "u-az-09", fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { id: "p-az-10", userId: "u-az-10", fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { id: "p-az-11", userId: "u-az-11", fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { id: "p-az-12", userId: "u-az-12", fullName: "هاني أحمد", position: "DEFENDER", jerseyNumber: 2 },
      { id: "p-az-13", userId: "u-az-13", fullName: "رامي ناصر", position: "FORWARD", jerseyNumber: 19 },
      { id: "p-az-14", userId: "u-az-14", fullName: "نبيل سعيد", position: "MIDFIELDER", jerseyNumber: 15 },
      { id: "p-az-15", userId: "u-az-15", fullName: "أسامة حسين", position: "DEFENDER", jerseyNumber: 20 },
      { id: "p-az-16", userId: "u-az-16", fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { id: "p-az-17", userId: "u-az-17", fullName: "ماجد أحمد", position: "FORWARD", jerseyNumber: 18 },
      { id: "p-az-18", userId: "u-az-18", fullName: "كريم طارق", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    id: "team-dakhel", name: "الدخيلة", shortName: "دخ",
    players: [
      { id: "p-dk-01", userId: "u-dk-01", fullName: "ياسر عادل", position: "FORWARD", jerseyNumber: 9 },
      { id: "p-dk-02", userId: "u-dk-02", fullName: "هشام سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { id: "p-dk-03", userId: "u-dk-03", fullName: "محمد ناصر", position: "DEFENDER", jerseyNumber: 4 },
      { id: "p-dk-04", userId: "u-dk-04", fullName: "أحمد حسين", position: "FORWARD", jerseyNumber: 11 },
      { id: "p-dk-05", userId: "u-dk-05", fullName: "خالد طارق", position: "MIDFIELDER", jerseyNumber: 8 },
      { id: "p-dk-06", userId: "u-dk-06", fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { id: "p-dk-07", userId: "u-dk-07", fullName: "finaly ياسر", position: "GOALKEEPER", jerseyNumber: 1 },
      { id: "p-dk-08", userId: "u-dk-08", fullName: "عمر أحمد", position: "MIDFIELDER", jerseyNumber: 14 },
      { id: "p-dk-09", userId: "u-dk-09", fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { id: "p-dk-10", userId: "u-dk-10", fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { id: "p-dk-11", userId: "u-dk-11", fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { id: "p-dk-12", userId: "u-dk-12", fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { id: "p-dk-13", userId: "u-dk-13", fullName: "رامي أحمد", position: "FORWARD", jerseyNumber: 19 },
      { id: "p-dk-14", userId: "u-dk-14", fullName: "نبيل حسين", position: "MIDFIELDER", jerseyNumber: 15 },
      { id: "p-dk-15", userId: "u-dk-15", fullName: "أسامة طارق", position: "DEFENDER", jerseyNumber: 20 },
      { id: "p-dk-16", userId: "u-dk-16", fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { id: "p-dk-17", userId: "u-dk-17", fullName: "ماجد ناصر", position: "FORWARD", jerseyNumber: 18 },
      { id: "p-dk-18", userId: "u-dk-18", fullName: "كريم سعيد", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    id: "team-mamoura", name: "المعمورة", shortName: "مع",
    players: [
      { id: "p-mm-01", userId: "u-mm-01", fullName: "نادر سعيد", position: "FORWARD", jerseyNumber: 9 },
      { id: "p-mm-02", userId: "u-mm-02", fullName: "عماد حسين", position: "MIDFIELDER", jerseyNumber: 7 },
      { id: "p-mm-03", userId: "u-mm-03", fullName: "محمد طارق", position: "DEFENDER", jerseyNumber: 4 },
      { id: "p-mm-04", userId: "u-mm-04", fullName: "أحمد ناصر", position: "FORWARD", jerseyNumber: 11 },
      { id: "p-mm-05", userId: "u-mm-05", fullName: "خالد وليد", position: "MIDFIELDER", jerseyNumber: 8 },
      { id: "p-mm-06", userId: "u-mm-06", fullName: "حسن أحمد", position: "DEFENDER", jerseyNumber: 3 },
      { id: "p-mm-07", userId: "u-mm-07", fullName: "finaly نادر", position: "GOALKEEPER", jerseyNumber: 1 },
      { id: "p-mm-08", userId: "u-mm-08", fullName: "عمر سعيد", position: "MIDFIELDER", jerseyNumber: 14 },
      { id: "p-mm-09", userId: "u-mm-09", fullName: "ياسر حسين", position: "DEFENDER", jerseyNumber: 5 },
      { id: "p-mm-10", userId: "u-mm-10", fullName: "سامي محمد", position: "FORWARD", jerseyNumber: 17 },
      { id: "p-mm-11", userId: "u-mm-11", fullName: "طارق أحمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { id: "p-mm-12", userId: "u-mm-12", fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { id: "p-mm-13", userId: "u-mm-13", fullName: "رامي حسين", position: "FORWARD", jerseyNumber: 19 },
      { id: "p-mm-14", userId: "u-mm-14", fullName: "نبيل سعيد", position: "MIDFIELDER", jerseyNumber: 15 },
      { id: "p-mm-15", userId: "u-mm-15", fullName: "أسامة أحمد", position: "DEFENDER", jerseyNumber: 20 },
      { id: "p-mm-16", userId: "u-mm-16", fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { id: "p-mm-17", userId: "u-mm-17", fullName: "ماجد طارق", position: "FORWARD", jerseyNumber: 18 },
      { id: "p-mm-18", userId: "u-mm-18", fullName: "كريم حسين", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    id: "team-saba", name: "سبا", shortName: "سبا",
    players: [
      { id: "p-sa-01", userId: "u-sa-01", fullName: "وليد عادل", position: "FORWARD", jerseyNumber: 9 },
      { id: "p-sa-02", userId: "u-sa-02", fullName: "فرج سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { id: "p-sa-03", userId: "u-sa-03", fullName: "محمد حسين", position: "DEFENDER", jerseyNumber: 4 },
      { id: "p-sa-04", userId: "u-sa-04", fullName: "أحمد طارق", position: "FORWARD", jerseyNumber: 11 },
      { id: "p-sa-05", userId: "u-sa-05", fullName: "خالد ناصر", position: "MIDFIELDER", jerseyNumber: 8 },
      { id: "p-sa-06", userId: "u-sa-06", fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { id: "p-sa-07", userId: "u-sa-07", fullName: "finaly وليد", position: "GOALKEEPER", jerseyNumber: 1 },
      { id: "p-sa-08", userId: "u-sa-08", fullName: "عمر أحمد", position: "MIDFIELDER", jerseyNumber: 14 },
      { id: "p-sa-09", userId: "u-sa-09", fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { id: "p-sa-10", userId: "u-sa-10", fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { id: "p-sa-11", userId: "u-sa-11", fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { id: "p-sa-12", userId: "u-sa-12", fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { id: "p-sa-13", userId: "u-sa-13", fullName: "رامي أحمد", position: "FORWARD", jerseyNumber: 19 },
      { id: "p-sa-14", userId: "u-sa-14", fullName: "نبيل حسين", position: "MIDFIELDER", jerseyNumber: 15 },
      { id: "p-sa-15", userId: "u-sa-15", fullName: "أسامة طارق", position: "DEFENDER", jerseyNumber: 20 },
      { id: "p-sa-16", userId: "u-sa-16", fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { id: "p-sa-17", userId: "u-sa-17", fullName: "ماجد سعيد", position: "FORWARD", jerseyNumber: 18 },
      { id: "p-sa-18", userId: "u-sa-18", fullName: "كريم ناصر", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    id: "team-rike", name: "ريكي", shortName: "ري",
    players: [
      { id: "p-rq-01", userId: "u-rq-01", fullName: "إبراهيم حسين", position: "FORWARD", jerseyNumber: 9 },
      { id: "p-rq-02", userId: "u-rq-02", fullName: "مصطفى ناصر", position: "MIDFIELDER", jerseyNumber: 7 },
      { id: "p-rq-03", userId: "u-rq-03", fullName: "محمد سعيد", position: "DEFENDER", jerseyNumber: 4 },
      { id: "p-rq-04", userId: "u-rq-04", fullName: "أحمد وليد", position: "FORWARD", jerseyNumber: 11 },
      { id: "p-rq-05", userId: "u-rq-05", fullName: "خالد طارق", position: "MIDFIELDER", jerseyNumber: 8 },
      { id: "p-rq-06", userId: "u-rq-06", fullName: "حسن أحمد", position: "DEFENDER", jerseyNumber: 3 },
      { id: "p-rq-07", userId: "u-rq-07", fullName: "finaly إبراهيم", position: "GOALKEEPER", jerseyNumber: 1 },
      { id: "p-rq-08", userId: "u-rq-08", fullName: "عمر ناصر", position: "MIDFIELDER", jerseyNumber: 14 },
      { id: "p-rq-09", userId: "u-rq-09", fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { id: "p-rq-10", userId: "u-rq-10", fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { id: "p-rq-11", userId: "u-rq-11", fullName: "طارق أحمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { id: "p-rq-12", userId: "u-rq-12", fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { id: "p-rq-13", userId: "u-rq-13", fullName: "رامي حسين", position: "FORWARD", jerseyNumber: 19 },
      { id: "p-rq-14", userId: "u-rq-14", fullName: "نبيل سعيد", position: "MIDFIELDER", jerseyNumber: 15 },
      { id: "p-rq-15", userId: "u-rq-15", fullName: "أسامة طارق", position: "DEFENDER", jerseyNumber: 20 },
      { id: "p-rq-16", userId: "u-rq-16", fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { id: "p-rq-17", userId: "u-rq-17", fullName: "ماجد أحمد", position: "FORWARD", jerseyNumber: 18 },
      { id: "p-rq-18", userId: "u-rq-18", fullName: "كريم طارق", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
  {
    id: "team-mahmoudia", name: "المحمودية", shortName: "مح",
    players: [
      { id: "p-mh-01", userId: "u-mh-01", fullName: "ياسر عادل", position: "FORWARD", jerseyNumber: 9 },
      { id: "p-mh-02", userId: "u-mh-02", fullName: "هشام سعيد", position: "MIDFIELDER", jerseyNumber: 7 },
      { id: "p-mh-03", userId: "u-mh-03", fullName: "محمد ناصر", position: "DEFENDER", jerseyNumber: 4 },
      { id: "p-mh-04", userId: "u-mh-04", fullName: "أحمد حسين", position: "FORWARD", jerseyNumber: 11 },
      { id: "p-mh-05", userId: "u-mh-05", fullName: "خالد طارق", position: "MIDFIELDER", jerseyNumber: 8 },
      { id: "p-mh-06", userId: "u-mh-06", fullName: "حسن وليد", position: "DEFENDER", jerseyNumber: 3 },
      { id: "p-mh-07", userId: "u-mh-07", fullName: "finaly ياسر", position: "GOALKEEPER", jerseyNumber: 1 },
      { id: "p-mh-08", userId: "u-mh-08", fullName: "عمر أحمد", position: "MIDFIELDER", jerseyNumber: 14 },
      { id: "p-mh-09", userId: "u-mh-09", fullName: "ياسر سعيد", position: "DEFENDER", jerseyNumber: 5 },
      { id: "p-mh-10", userId: "u-mh-10", fullName: "سامي حسين", position: "FORWARD", jerseyNumber: 17 },
      { id: "p-mh-11", userId: "u-mh-11", fullName: "طارق محمد", position: "MIDFIELDER", jerseyNumber: 10 },
      { id: "p-mh-12", userId: "u-mh-12", fullName: "هاني ناصر", position: "DEFENDER", jerseyNumber: 2 },
      { id: "p-mh-13", userId: "u-mh-13", fullName: "رامي أحمد", position: "FORWARD", jerseyNumber: 19 },
      { id: "p-mh-14", userId: "u-mh-14", fullName: "نبيل حسين", position: "MIDFIELDER", jerseyNumber: 15 },
      { id: "p-mh-15", userId: "u-mh-15", fullName: "أسامة طارق", position: "DEFENDER", jerseyNumber: 20 },
      { id: "p-mh-16", userId: "u-mh-16", fullName: "finaly عمر", position: "GOALKEEPER", jerseyNumber: 22 },
      { id: "p-mh-17", userId: "u-mh-17", fullName: "ماجد ناصر", position: "FORWARD", jerseyNumber: 18 },
      { id: "p-mh-18", userId: "u-mh-18", fullName: "كريم سعيد", position: "MIDFIELDER", jerseyNumber: 13 },
    ],
  },
];

function avatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a2e&color=d4a843&size=200&bold=true`;
}

function crest(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d4a843&color=1a1a2e&size=400&bold=true&font-size=0.4`;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function handleSeed() {
  try {
    await requireAdmin();

    const league = await prisma.tournament.findFirst({ where: { status: "ONGOING" }, select: { id: true } });
    if (!league) return NextResponse.json({ error: "لا توجد بطولة نشطة" }, { status: 500 });

    const leagueSeason = await prisma.season.findFirst({ where: { tournamentId: league.id }, select: { id: true } });
    if (!leagueSeason) return NextResponse.json({ error: "لا يوجد موسم" }, { status: 500 });

    let teamsAdded = 0;
    let playersAdded = 0;
    let matchesAdded = 0;

    for (const team of NEW_TEAMS) {
      const existing = await prisma.team.findUnique({ where: { id: team.id } });
      if (!existing) {
        await prisma.team.create({ data: { id: team.id, name: team.name, shortName: team.shortName, city: "الإسكندرية", crestUrl: crest(team.name) } });
        teamsAdded++;
      }

      await prisma.tournamentTeam.upsert({
        where: { tournamentId_teamId: { tournamentId: league.id, teamId: team.id } },
        update: {},
        create: { tournamentId: league.id, teamId: team.id },
      }).catch(() => {});

      for (const p of team.players) {
        const userExists = await prisma.user.findUnique({ where: { id: p.userId } });
        if (!userExists) {
          const passwordHash = "seed:placeholder";
          await prisma.user.upsert({
            where: { id: p.userId }, update: {},
            create: { id: p.userId, email: `${p.id}@seed.local`, passwordHash, fullName: p.fullName, role: "PLAYER" },
          });
        }

        const playerExists = await prisma.player.findUnique({ where: { id: p.id } });
        if (!playerExists) {
          await prisma.player.create({
            data: { id: p.id, userId: p.userId, photoUrl: avatar(p.fullName), position: p.position as never, jerseyNumber: p.jerseyNumber },
          });
          playersAdded++;
        }

        await prisma.teamMembership.upsert({
          where: { teamId_playerId: { teamId: team.id, playerId: p.id } },
          update: {},
          create: { teamId: team.id, playerId: p.id, status: "ACTIVE", joinedAt: new Date("2024-09-01") },
        }).catch(() => {});
      }
    }

    const newMatchDefs = [
      { id: "lg-m16", home: "team-kanaya", away: "team-gomrok", hs: 2, as: 1 },
      { id: "lg-m17", home: "team-bahari", away: "team-wardian", hs: 1, as: 0 },
      { id: "lg-m18", home: "team-azmout", away: "team-dakhel", hs: 0, as: 0 },
      { id: "lg-m19", home: "team-mamoura", away: "team-saba", hs: 3, as: 2 },
      { id: "lg-m20", home: "team-rike", away: "team-mahmoudia", hs: 1, as: 1 },
      { id: "lg-m21", home: "team-gomrok", away: "team-bahari", hs: 2, as: 2 },
      { id: "lg-m22", home: "team-wardian", away: "team-azmout", hs: 1, as: 3 },
      { id: "lg-m23", home: "team-dakhel", away: "team-mamoura", hs: 0, as: 1 },
      { id: "lg-m24", home: "team-saba", away: "team-rike", hs: 2, as: 0 },
      { id: "lg-m25", home: "team-mahmoudia", away: "team-kanaya", hs: 1, as: 2 },
      { id: "lg-m26", home: "team-kanaya", away: "team-bahari", hs: 1, as: 0 },
      { id: "lg-m27", home: "team-azmout", away: "team-gomrok", hs: 2, as: 1 },
      { id: "lg-m28", home: "team-mamoura", away: "team-wardian", hs: 0, as: 0 },
    ];

    const rounds = ["الأسبوع 1", "الأسبوع 1", "الأسبوع 1", "الأسبوع 1", "الأسبوع 1", "الأسبوع 2", "الأسبوع 2", "الأسبوع 2", "الأسبوع 2", "الأسبوع 2", "الأسبوع 3", "الأسبوع 3", "الأسبوع 3"];

    for (let i = 0; i < newMatchDefs.length; i++) {
      const m = newMatchDefs[i]!;
      const existing = await prisma.match.findUnique({ where: { id: m.id } });
      if (!existing) {
        await prisma.match.create({
          data: {
            id: m.id, tournamentId: league.id, seasonId: leagueSeason.id,
            homeTeamId: m.home, awayTeamId: m.away, status: "FINISHED",
            kickoffAt: daysAgo(28 - (i < 5 ? 0 : i < 10 ? 7 : 14)),
            homeScore: m.hs, awayScore: m.as, round: rounds[i]!,
          },
        });
        matchesAdded++;
      }
    }

    const goalDefs = [
      { mid: "lg-m16", pid: "p-ky-01", tid: "team-kanaya", c: 2 }, { mid: "lg-m16", pid: "p-gr-01", tid: "team-gomrok", c: 1 },
      { mid: "lg-m17", pid: "p-bh-01", tid: "team-bahari", c: 1 },
      { mid: "lg-m19", pid: "p-mm-01", tid: "team-mamoura", c: 2 }, { mid: "lg-m19", pid: "p-mm-02", tid: "team-mamoura", c: 1 },
      { mid: "lg-m19", pid: "p-sa-01", tid: "team-saba", c: 2 },
      { mid: "lg-m20", pid: "p-rq-01", tid: "team-rike", c: 1 }, { mid: "lg-m20", pid: "p-mh-01", tid: "team-mahmoudia", c: 1 },
      { mid: "lg-m21", pid: "p-gr-02", tid: "team-gomrok", c: 1 }, { mid: "lg-m21", pid: "p-gr-03", tid: "team-gomrok", c: 1 },
      { mid: "lg-m21", pid: "p-bh-01", tid: "team-bahari", c: 1 }, { mid: "lg-m21", pid: "p-bh-02", tid: "team-bahari", c: 1 },
      { mid: "lg-m22", pid: "p-az-01", tid: "team-azmout", c: 2 }, { mid: "lg-m22", pid: "p-az-02", tid: "team-azmout", c: 1 },
      { mid: "lg-m22", pid: "p-wd-01", tid: "team-wardian", c: 1 },
      { mid: "lg-m23", pid: "p-mm-01", tid: "team-mamoura", c: 1 },
      { mid: "lg-m24", pid: "p-sa-01", tid: "team-saba", c: 1 }, { mid: "lg-m24", pid: "p-sa-02", tid: "team-saba", c: 1 },
      { mid: "lg-m25", pid: "p-ky-01", tid: "team-kanaya", c: 1 }, { mid: "lg-m25", pid: "p-ky-02", tid: "team-kanaya", c: 1 },
      { mid: "lg-m25", pid: "p-mh-01", tid: "team-mahmoudia", c: 1 },
      { mid: "lg-m26", pid: "p-ky-03", tid: "team-kanaya", c: 1 },
      { mid: "lg-m27", pid: "p-az-01", tid: "team-azmout", c: 1 }, { mid: "lg-m27", pid: "p-az-03", tid: "team-azmout", c: 1 },
      { mid: "lg-m27", pid: "p-gr-01", tid: "team-gomrok", c: 1 },
    ];

    let eventsAdded = 0;
    let counter = 0;
    for (const g of goalDefs) {
      const matchExists = await prisma.match.findUnique({ where: { id: g.mid } });
      if (!matchExists) continue;
      for (let i = 0; i < g.c; i++) {
        counter++;
        const evId = `ev-${g.mid}-${g.pid}-${counter}`;
        const evExists = await prisma.matchEvent.findUnique({ where: { id: evId } }).catch(() => null);
        if (!evExists) {
          await prisma.matchEvent.create({
            data: { id: evId, matchId: g.mid, playerId: g.pid, teamId: g.tid, type: "GOAL", minute: (counter % 88) + 1 },
          });
          eventsAdded++;
        }
      }
    }

    const totalTeams = await prisma.team.count();
    const totalPlayers = await prisma.player.count();

    return NextResponse.json({
      ok: true,
      teamsAdded,
      playersAdded,
      matchesAdded,
      eventsAdded,
      totalTeams,
      totalPlayers,
      message: `تم بنجاح: ${teamsAdded} فريق, ${playersAdded} لاعب, ${matchesAdded} مباراة, ${eventsAdded} هدف. الإجمالي: ${totalTeams} فريق, ${totalPlayers} لاعب`,
    });
  } catch (error) {
    console.error("[admin/seed]", error);
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}

export async function GET() { return handleSeed(); }
export async function POST() { return handleSeed(); }
