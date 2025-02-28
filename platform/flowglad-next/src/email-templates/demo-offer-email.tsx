import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
} from '@react-email/components'
import * as React from 'react'

interface DemoOfferEmailProps {
  //   steps?: {
  //     id: number
  //     Description: React.ReactNode
  //   }[]
  //   links?: string[]
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : ''

const PropDefaults: DemoOfferEmailProps = {
  steps: [
    {
      id: 1,
      Description: (
        <li className="mb-20" key={1}>
          <strong>Deploy your first project.</strong>{' '}
          <Link>Connect to Git, choose a template</Link>, or manually
          deploy a project you&apos;ve been working on locally.
        </li>
      ),
    },
    {
      id: 2,
      Description: (
        <li className="mb-20" key={2}>
          <strong>Check your deploy logs.</strong> Find out
          what&apos;s included in your build and watch for errors or
          failed deploys.{' '}
          <Link>Learn how to read your deploy logs</Link>.
        </li>
      ),
    },
    {
      id: 3,
      Description: (
        <li className="mb-20" key={3}>
          <strong>Choose an integration.</strong> Quickly discover,
          connect, and configure the right tools for your project with
          150+ integrations to choose from.{' '}
          <Link>Explore the Integrations Hub</Link>.
        </li>
      ),
    },
    {
      id: 4,
      Description: (
        <li className="mb-20" key={4}>
          <strong>Set up a custom domain.</strong> You can register a
          new domain and buy it through Netlify or assign a domain you
          already own to your site. <Link>Add a custom domain</Link>.
        </li>
      ),
    },
  ],
  links: ['Visit the forums', 'Read the docs', 'Contact an expert'],
}

export const DemoOfferEmail = ({}: //   steps = PropDefaults.steps,
//   links = PropDefaults.links,
DemoOfferEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Design Strategy Session Awaits</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: '#9D32F6',
                offwhite: '#fafbfb',
              },
              spacing: {
                0: '0px',
                20: '20px',
                45: '45px',
              },
            },
          },
        }}
      >
        <Body className="bg-white text-base font-sans">
          <Img
            src={'https://staging-cdn-flowglad.com/proxima-logo.png'}
            width="141"
            height="27"
            alt="Proxima Design"
            className="mx-auto my-20"
          />
          <Container className="bg-white p-45">
            <Heading className="text-center my-0 leading-8">
              Let&apos;s Talk Design Strategy
            </Heading>

            <Section>
              <Row>
                <Text className="text-base">
                  Hope you enjoyed the site template! Wanna take your
                  dashboard page next level?
                </Text>

                <Text className="text-base">
                  Grab a time with me below to find out how to spot
                  customer insights in your dashboard to make the most
                  of your dashboard template and the data powering it!{' '}
                </Text>
              </Row>
            </Section>
            <Section>
              <Img
                src={
                  'https://staging-cdn-flowglad.com/proxima-chat.png'
                }
                width="600"
                height="345"
                alt="Proxima Design Chat"
                className="mx-auto my-8"
              />
            </Section>

            <Section>
              <Row>
                <Text className="text-base font-bold">
                  Why schedule a time to chat?
                </Text>
              </Row>
              <Row>
                <Text className="text-base">
                  - Instant Insights: How to identify them
                </Text>
                <Text className="text-base">
                  - Easy Reporting: Find out how to export the right
                  data
                </Text>
                <Text className="text-base">
                  - Expert tips: Learn best practices from the pros.
                </Text>
              </Row>
            </Section>

            {/* <ul>{steps?.map(({ Description }) => Description)}</ul> */}

            <Section className="text-left">
              <Button
                className="bg-brand text-white rounded-lg py-3 px-[18px] cursor-pointer"
                href="https://cal.com/agreeahmed/design-strategy-session"
                target="_blank"
              >
                Schedule Strategy Session
              </Button>
            </Section>

            {/* <Section className="mt-45">
              <Row>
                {links?.map((link) => (
                  <Column key={link}>
                    <Link className="text-black underline font-bold">
                      {link}
                    </Link>{' '}
                    <span className="text-green-500">→</span>
                  </Column>
                ))}
              </Row>
            </Section> */}
          </Container>

          <Container className="mt-20">
            <Section>
              <Row>
                <Column className="text-right px-20">
                  <Link>Unsubscribe</Link>
                </Column>
                <Column className="text-left">
                  <Link>Manage Preferences</Link>
                </Column>
              </Row>
            </Section>
            <Text className="text-center text-gray-400 mb-45">
              Proxima Design, 123 Fake Street, Suite 300 San
              Francisco, CA
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default DemoOfferEmail
