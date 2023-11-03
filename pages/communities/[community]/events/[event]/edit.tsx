import { EventForm } from "@/components/EventForm/EventForm";
import Layout from "@/components/Layout/Layout";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import Head from "next/head";
import prisma from "../../../../../server/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

const EditEventPage: NextPage = ({
  event,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  if (!event) return null;

  const {
    address,
    description,
    name,
    id,
    capacity,
    eventDate,
    communityId,
    coverImage,
  } = event;

  return (
    <>
      <Head>
        <title>{`Codú`}</title>
        <meta name="description" content="Codú | Web Developer Community" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="site.webmanifest" />
        <link rel="mask-icon" href="safari-pinned-tab.svg" color="#000000" />
        <link rel="shortcut icon" href="favicon.ico" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="browserconfig.xml" />
        <meta name="theme-color" content="#000" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
        <meta
          property="og:image"
          content="https://codu.co/images/og/home-og.png"
          key="og:image"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://codu.co" />
      </Head>
      <Layout>
        <div className="mx-auto lg:col-span-9 max-w-2xl flex-grow flex flex-col justify-center w-full px-4 sm:px-6">
          <div className="bg-neutral-900 text-neutral-700 shadow-xl">
            <EventForm
              defaultValues={{
                address,
                description,
                name,
                id,
                capacity,
                eventDate,
                communityId,
                coverImage,
              }}
            />
          </div>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps = async (
  ctx: GetServerSidePropsContext<{ event: string }>,
) => {
  try {
    const session = await getServerSession(ctx.req, ctx.res, authOptions);

    if (!session) {
      return {
        redirect: {
          destination: "/get-started",
          permanent: false,
        },
      };
    }

    const { params } = ctx;

    if (!params?.event) {
      throw new Error("No event");
    }

    const event = await prisma.event.findUnique({
      where: {
        slug: params.event,
      },
      include: {
        RSVP: {
          include: {
            user: true,
          },
        },
        community: {
          select: {
            excerpt: true,
            slug: true,
            name: true,
            city: true,
            country: true,
            coverImage: true,
            members: {
              select: {
                id: true,
                isEventOrganiser: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!event) throw new Error("Event not found");

    if (
      !event.community.members.some(
        (member) =>
          member.userId === session.user?.id && member.isEventOrganiser,
      )
    ) {
      return {
        redirect: {
          destination: "/403",
          permanent: false,
        },
      };
    }

    return {
      props: {
        event,
        host: ctx.req.headers.host || "",
      },
    };
  } catch {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
      props: {},
    };
  }
};

export default EditEventPage;
