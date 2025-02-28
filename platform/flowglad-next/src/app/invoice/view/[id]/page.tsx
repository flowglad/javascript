import { notFound } from 'next/navigation'
import { selectInvoices } from '@/db/tableMethods/invoiceMethods'
import { adminTransaction } from '@/db/databaseMethods'

const InvoiceRow = ({
  item,
}: {
  item: {
    qty: number
    description: string
    price: number
  }
}) => {
  return (
    <tr className="text-black">
      <td>{item.qty}</td>
      <td>{item.description}</td>
      <td className="text-right">${item.price.toFixed(2)}</td>
      <td className="text-right font-bold">
        ${(item.qty * item.price).toFixed(2)}
      </td>
    </tr>
  )
}

const InvoicePage = async ({
  params,
}: {
  params: { id: string }
}) => {
  const invoice = await adminTransaction(async ({ transaction }) => {
    return selectInvoices({ id: params.id }, transaction)
  })

  //   if (!invoice) {
  //     return notFound()
  //   }
  // Mock data - replace with actual invoice data
  const invoiceData = {
    clientName: 'Anvil Co',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103',
    email: 'hello@useanvil.com',
    invoiceDate: 'May 24th, 2024',
    invoiceNumber: '12345',
    items: [
      { qty: 2, description: 'Blue large widgets', price: 15.0 },
      { qty: 4, description: 'Green medium widgets', price: 10.0 },
      {
        qty: 5,
        description: 'Red small widgets with logo',
        price: 7.0,
      },
    ],
    accountNo: '123567744',
    routingNo: '120000547',
    dueDate: 'May 30th, 2024',
    totalDue: 105.0,
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center">
              <img
                src="https://app.useanvil.com/img/email-logo-black.png"
                alt="Anvil Logo"
                width={100}
                height={18}
              />
              <div className="text-sm text-gray-600">
                Page <span className="font-bold">1</span> of{' '}
                <span className="font-bold">1</span>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="text-2xl font-bold">
                {invoiceData.clientName}
              </h1>
              <p>{invoiceData.address}</p>
              <p>{`${invoiceData.city}, ${invoiceData.state} ${invoiceData.zipCode}`}</p>
              <p>{invoiceData.email}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="font-bold">{invoiceData.invoiceDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Invoice Number
                </p>
                <p className="font-bold">
                  {invoiceData.invoiceNumber}
                </p>
              </div>
            </div>

            <table className="mt-5 w-full">
              <thead>
                <tr className="text-sm text-gray-600 text-left">
                  <th>Qty</th>
                  <th>Description</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item) => (
                  <InvoiceRow key={item.description} item={item} />
                ))}
              </tbody>
            </table>

            <div className="mt-5 border-t pt-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Payment Info
                  </p>
                  <p className="text-black">
                    Account No:{' '}
                    <span className="font-bold text-black">
                      {invoiceData.accountNo}
                    </span>
                  </p>
                  <p className="text-black">
                    Routing No:{' '}
                    <span className="font-bold text-black">
                      {invoiceData.routingNo}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-black">Due By</p>
                  <p className="font-bold text-black">
                    {invoiceData.dueDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-black">Total Due</p>
                  <p className="font-bold text-xl text-black">
                    ${invoiceData.totalDue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 text-center text-sm text-gray-600">
              <p>{invoiceData.email} | 555 444 6666 | useanvil.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoicePage
