import React, {Component} from 'react';
import { Form, Button, Message } from 'semantic-ui-react';
import { addCouponURL } from '../constants';
import { authAxios } from '../utils';


class AddCoupon extends Component {
  state = {
    code: '',
    loading: false,
    success: false,
    error: null
  }

  handleAddCoupon = e => {
    e.preventDefault();
    this.setState({ loading: true });

    const { code } = this.state;

    authAxios.post(addCouponURL, { code })
      .then(res => {
        this.setState({ loading: false});
        this.props.handleFetchOrder()
      })
      .catch(err => {
        this.setState({loading: false, error: err})
      })
  }

  handleChange = e => {
    e.preventDefault();
    this.setState({
      code: e.target.value
    })
  }

  render() {
    const { code, error, success } = this.state;

    return (
      <>
        {error && (
          <Message negative>
            <Message.Header>Your payment unsuccessful</Message.Header>
            <p>
              {JSON.stringify(error)}
            </p>
          </Message>
        )}

        {success && (
          <Message positive>
            <Message.Header>Your payment was successful</Message.Header>
            <p>
              Go to your <b>profile</b> to see the delivery status.
            </p>
          </Message>
        )}

        <Form onSubmit={this.handleAddCoupon}>
          <Form.Field>
            <label>Coupon code</label>
            <input onChange={this.handleChange} placeholder='Enter a coupon..' value={code} name='code' />
          </Form.Field>
          <Button type='submit'>Add coupon</Button>
        </Form>
      </>
    )
  }
}


export default AddCoupon;
