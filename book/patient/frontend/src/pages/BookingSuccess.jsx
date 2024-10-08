import React from 'react'
import sparks from "../assets/sparks.png";

function BookingSuccess() {
  return (
    <section class="py-20">
      <div class="max-w-5xl mx-auto py-16 border-2 border-solid">
        <article class="overflow-hidden">
        <div class="rounded-b-md">
          <div class="p-9">
          <div class="space-y-6 text-slate-700">
            <img class="object-cover h-12" src={sparks} />

            <p class="text-xl font-extrabold tracking-tight uppercase font-body">
            Invoice
            </p>
          </div>
          </div>
          <div class="p-9">
          <div class="flex w-full">
            <div class="grid grid-cols-4 gap-12">
            <div class="text-sm font-light text-slate-500">
              <p class="text-sm font-normal text-slate-700">
              Invoice Detail:
              </p>
              <p>Sparks Tech</p>
              <p>Fake Street 123</p>
              <p>San Javier</p>
              <p>CA 1234</p>
            </div>
            <div class="text-sm font-light text-slate-500">
              <p class="text-sm font-normal text-slate-700">Billed To</p>
              <p>The Boring Company</p>
              <p>Tesla Street 007</p>
              <p>Frisco</p>
              <p>CA 0000</p>
            </div>
            <div class="text-sm font-light text-slate-500">
              <p class="text-sm font-normal text-slate-700">Invoice Number</p>
              <p>000000</p>

              <p class="mt-2 text-sm font-normal text-slate-700">
              Date of Issue
              </p>
              <p>00.00.00</p>
            </div>
            <div class="text-sm font-light text-slate-500">
              <p class="text-sm font-normal text-slate-700">Terms</p>
              <p>0 Days</p>

              <p class="mt-2 text-sm font-normal text-slate-700">Due</p>
              <p>00.00.00</p>
            </div>
            </div>
          </div>
          </div>

          <div class="p-9">
          <div class="flex flex-col mx-0 mt-8">
            <table class="min-w-full divide-y divide-slate-500">
            <thead>
              <tr>
              <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-normal text-slate-700 sm:pl-6 md:pl-0">
                Description
              </th>
              <th scope="col" class="hidden py-3.5 px-3 text-right text-sm font-normal text-slate-700 sm:table-cell">
                Quantity
              </th>
              <th scope="col" class="hidden py-3.5 px-3 text-right text-sm font-normal text-slate-700 sm:table-cell">
                Rate
              </th>
              <th scope="col" class="py-3.5 pl-3 pr-4 text-right text-sm font-normal text-slate-700 sm:pr-6 md:pr-0">
                Amount
              </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-slate-200">
              <td class="py-4 pl-4 pr-3 text-sm sm:pl-6 md:pl-0">
                <div class="font-medium text-slate-700">Bookit</div>
                <div class="mt-0.5 text-slate-500 sm:hidden">
                per month
                </div>
              </td>
              <td class="hidden px-3 py-4 text-sm text-right text-slate-500 sm:table-cell">
                48
              </td>
              <td class="hidden px-3 py-4 text-sm text-right text-slate-500 sm:table-cell">
                $0.00
              </td>
              <td class="py-4 pl-3 pr-4 text-sm text-right text-slate-500 sm:pr-6 md:pr-0">
                $0.00
              </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
              <th scope="row" colspan="3" class="hidden pt-6 pl-6 pr-3 text-sm font-light text-right text-slate-500 sm:table-cell md:pl-0">
                Subtotal
              </th>
              <th scope="row" class="pt-6 pl-4 pr-3 text-sm font-light text-left text-slate-500 sm:hidden">
                Subtotal
              </th>
              <td class="pt-6 pl-3 pr-4 text-sm text-right text-slate-500 sm:pr-6 md:pr-0">
                $0.00
              </td>
              </tr>
              <tr>
              <th scope="row" colspan="3" class="hidden pt-6 pl-6 pr-3 text-sm font-light text-right text-slate-500 sm:table-cell md:pl-0">
                Discount
              </th>
              <th scope="row" class="pt-6 pl-4 pr-3 text-sm font-light text-left text-slate-500 sm:hidden">
                Discount
              </th>
              <td class="pt-6 pl-3 pr-4 text-sm text-right text-slate-500 sm:pr-6 md:pr-0">
                $0.00
              </td>
              </tr>
              <tr>
              <th scope="row" colspan="3" class="hidden pt-4 pl-6 pr-3 text-sm font-light text-right text-slate-500 sm:table-cell md:pl-0">
                Tax
              </th>
              <th scope="row" class="pt-4 pl-4 pr-3 text-sm font-light text-left text-slate-500 sm:hidden">
                Tax
              </th>
              <td class="pt-4 pl-3 pr-4 text-sm text-right text-slate-500 sm:pr-6 md:pr-0">
                $0.00
              </td>
              </tr>
              <tr>
              <th scope="row" colspan="3" class="hidden pt-4 pl-6 pr-3 text-sm font-normal text-right text-slate-700 sm:table-cell md:pl-0">
                Total
              </th>
              <th scope="row" class="pt-4 pl-4 pr-3 text-sm font-normal text-left text-slate-700 sm:hidden">
                Total
              </th>
              <td class="pt-4 pl-3 pr-4 text-sm font-normal text-right text-slate-700 sm:pr-6 md:pr-0">
                $0.00
              </td>
              </tr>
            </tfoot>
            </table>
          </div>
          </div>

          <div class="mt-48 p-9">
          <div class="border-t pt-9 border-slate-200">
            <div class="text-sm font-light text-slate-700">
            Copyright&copy; by Sparks Tech
            </div>
          </div>
          </div>
        </div>
        </article>
      </div>
      </section>
  )
}

export default BookingSuccess;

//booking confirmation page (will display receipt that we will sent to the patient via sms, email, whatsapp)