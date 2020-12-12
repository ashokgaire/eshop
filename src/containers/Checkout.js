import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { CardElement, injectStripe, Elements, StripeProvider } from 'react-stripe-elements';
import { Container, Button, Message, Header, Divider, Select } from 'semantic-ui-react';
import { authAxios } from '../utils';
import { checkoutURL, orderSumaryURL, addressListURL } from '../constants';
import OrderCheckoutPreview from './OrderCheckoutPreview';
import AddCoupon from './AddCoupon';



class CheckoutForm extends Component {
  state = {
    data: null,
    loading: false,
    success: false,
    error: null,
    shippingAddresses: [],
    billingAddresses: [],
    billingAddress: '',
    shippingAddress: '',
    selectedBillingAddress: '',
    selectedShippingAddress: ''
  }

  componentDidMount() {
    this.handleFetchOrder();
    this.handleFetchBillingAddresses();
    this.handleFetchShippingAddresses()
  }

  handleFetchOrder = () => {
    this.setState({ loading: true });
    authAxios
      .get(orderSumaryURL)
      .then(res => {
        this.setState({ data: res.data, loading: false });
      })
      .catch(error => {
        if (error.response.status === 404) {
          this.setState({ error: "You currently do not have an order", loading: false });
          this.props.history.push('/products');
        } else {
          this.setState({ error, loading: false });
        }
      });
  }

  handleGetDefaultAddress = addresses => {
    const filteredAddresses = addresses.filter(el => el.default === true);
    if (filteredAddresses.length > 0) {
      return filteredAddresses[0].id;
    }
    return '';
  }

  handleFetchBillingAddresses = () => {
    this.setState({ loading: true });
    authAxios
      .get(addressListURL('B'))
      .then(res => {
        this.setState({
          billingAddresses: res.data.map(a => {
            return {
              key: a.id,
              text: `${a.street_address}, ${a.apartment_address}, ${a.country}`,
              value: a.id
            }
          }),
          selectedBillingAddress: this.handleGetDefaultAddress(res.data),
          loading: false
        });
      })
      .catch(error => {
        this.setState({ error, loading: false });
      });
  }

  handleFetchShippingAddresses = () => {
    this.setState({ loading: true });
    authAxios
      .get(addressListURL('S'))
      .then(res => {
        this.setState({
          shippingAddresses: res.data.map(a => {
            return {
              key: a.id,
              text: `${a.street_address}, ${a.apartment_address}, ${a.country}`,
              value: a.id
            }
          }),
          selectedShippingAddress: this.handleGetDefaultAddress(res.data),
          loading: false
        });
      })
      .catch(error => {
        this.setState({ error, loading: false });
      });
  }


  submit = (e) => {
    e.preventDefault();
    this.setState({ loading: true });
    if (this.props.stripe) {
      this.props.stripe.createToken()
        .then(result => {
          if (result.error) {
            this.setState({ error: result.error.message, loading: false })
          } else {
            this.setState({ error: null })
            const { selectedBillingAddress, selectedShippingAddress } = this.state;
            authAxios.post(checkoutURL, {
              stripeToken: result.token.id,
              selectedBillingAddress,
              selectedShippingAddress
            })
              .then(res => {
                this.setState({ loading: false, success: true });
              })
              .catch(err => {
                this.setState({ loading: false, error: err });
              })
          }
        })
    } else {
      console.log('Stripe is not loaded')
    }
  }

  handleSelectChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  }

  render() {
    const {
      data,
      error,
      loading,
      success,
      billingAddresses,
      shippingAddresses,
      selectedShippingAddress,
      selectedBillingAddress
    } = this.state;

    return (
      <div className="checkout">
        {error && (
          <Message negative>
            <Message.Header>Your payment unsuccessful</Message.Header>
            <p>
              {JSON.stringify(error)}
            </p>
          </Message>
        )}

        <OrderCheckoutPreview data={data} />

        <Divider />

        <AddCoupon handleFetchOrder={() => this.handleFetchOrder()} />

        {shippingAddresses.length > 0 ?
          <>
            <Divider />
            <Header>Select a billing address.</Header>
            <Select
              name='selectedBillingAddress'
              value={selectedBillingAddress}
              options={billingAddresses}
              clearable selection fluid
              onChange={this.handleSelectChange}
            />
          </>
          :
          <p>Please update your prodfile to <Link to='/profile'>add billing address</Link>.</p>
        }
        {shippingAddresses.length > 0 ?
          <>
            <Divider />
            <Header>Select a shipping address.</Header>
            <Select
              name='selectedShippingAddress'
              value={selectedShippingAddress}
              options={shippingAddresses}
              clearable selection fluid
              onChange={this.handleSelectChange}
            />
          </>
          :
          <p>Please update your prodfile to <Link to='/profile'>add shipping address</Link>.</p>
        }

        <Divider />

        {billingAddresses.length < 1 || shippingAddresses < 1 ?
          <p>Please update your prodfile to <Link to='/profile'>add an address</Link>.</p>
          :
          (
            <>
              <Header>Would you like to complete the purchase?</Header>
              {success && (
                <Message positive>
                  <Message.Header>Your payment was successful</Message.Header>
                  <p>
                    Go to your <b><Link to='/profile'>profile</Link></b> to see the delivery status.
                  </p>
                </Message>
              )}
              <CardElement />
              <Button primary loading={loading} disabled={loading} onClick={this.submit} style={{ marginTop: '1rem' }}>Submit</Button>
            </>
          )
        }
      </div>
    );
  }
}

const InjectedForm = withRouter(injectStripe(CheckoutForm));

const WrappedCheckoutForm = () => (
  <Container text>
    <StripeProvider apiKey="pk_test_jPO1MtcAbyylYSkZe0RGmRHw00QcwqEVKQ">
      <>
        <h1>Complete your order.</h1>
        <Elements>
          <InjectedForm />
        </Elements>
      </>
    </StripeProvider>
  </Container>
)

export default WrappedCheckoutForm;
