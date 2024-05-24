import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useContext } from 'react'
import Stripe from 'stripe'
import { CartContext } from '../../context/CartContext'
import { stripe } from '../../lib/stripe'
import {
  ImageContainer,
  ProductContainer,
  ProductDetails,
} from '../../styles/pages/product'
import { priceFormatter } from '../../utils/formatter'

interface ProductProps {
  product: {
    id: string
    name: string
    imageUrl: string
    price: number
    description: string
    defaultPriceId: string
  }
}

export default function Product({ product }: ProductProps) {
  const { addItemsToCart, orderAlreadyExist } = useContext(CartContext)

  function handleAddItemToCart() {
    const addNewItemToCart = { ...product }
    addItemsToCart(addNewItemToCart)
  }

  const ifOrderAlreadyExists = orderAlreadyExist(product.id)

  return (
    <>
      <Head>
        <title>{product.name} | Ignite Shop 2.0</title>
      </Head>

      <ProductContainer>
        <ImageContainer>
          <Image src={product.imageUrl} alt="" width={520} height={480} />
        </ImageContainer>

        <ProductDetails>
          <h1>{product.name}</h1>
          <span>{priceFormatter.format(product.price)}</span>

          <p>{product.description}</p>

          <button onClick={handleAddItemToCart} disabled={ifOrderAlreadyExists}>
            {ifOrderAlreadyExists
              ? 'Produto já está no carrinho'
              : 'Colocar na sacola'}
          </button>
        </ProductDetails>
      </ProductContainer>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  if (!query.session_id) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      }
    }
  }

  const sessionId = String(query.session_id)

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'line_items.data.price.product']
  })

  const customerName = session.customer_details.name

  const products = session.line_items.data.map(item => {
    const product = item.price.product as Stripe.Product

    return {
      id: product.id,
      name: product.name,
      imageUrl: product.images[0],
      quantity: item.quantity,
    }
  })
    
  return {
    props: {
      customerName,
      products,
    }
  }
}