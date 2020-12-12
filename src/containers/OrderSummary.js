import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  Label,
  Table,
  Container,
  Header,
  Button,
  Message,
  Segment,
  Dimmer,
  Loader,
  Image,
  Icon
} from 'semantic-ui-react';
import { authAxios } from '../utils';
import {
  orderSumaryURL,
  orderItemDeleteURL,
  addToCartURL,
  orderItemUpdataQuantityURL
} from '../constants';

class OrderSummary extends Component {
  state = {
    data: null,
    error: null,
    loading: null
  };

  componentDidMount() {
    this.handleFetchOrder();
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
          this.setState({
            error: 'You currently do not have an order',
            loading: false
          });
        } else {
          this.setState({ error, loading: false });
        }
      });
  };

  renderVariations = orderItem => {
    let text = '';
    orderItem.item_variations.forEach(iv => {
      text += `${iv.variation.name}: ${iv.value}, `;
    });

    return text;
  };

  handleRemoveItem = itemID => {
    authAxios
      .delete(orderItemDeleteURL(itemID))
      .then(res => {
        this.handleFetchOrder();
      })
      .catch(error => {
        this.setState({ error, loading: false });
      });
  };

  handleAddToCart = (slug, itemVariations) => {
    this.setState({ loading: true });
    const variations = this.handleFormatData(itemVariations);

    authAxios
      .post(addToCartURL, { slug, variations })
      .then(res => {
        console.log('Added to cart', res.data);
        // update cart count
        this.handleFetchOrder();
        this.setState({ loading: false });
      })
      .catch(error => {
        this.setState({ error: error.response.data, loading: false });
      });
  };

  handleFormatData = itemVariations => {
    return Object.keys(itemVariations).map(key => {
      return itemVariations[key].id;
    });
  };

  handleReduceQuantityFromCart = slug => {
    authAxios
      .post(orderItemUpdataQuantityURL, { slug })
      .then(res => {
        console.log('Removed from cart');
        // update cart count
        this.handleFetchOrder();
        this.setState({ loading: false });
      })
      .catch(error => {
        this.setState({ error: error.response.data, loading: false });
      });
  };

  render() {
    const { data, loading, error } = this.state;

    return (
      <Container>
        <Header as='h3'>Order Summary</Header>
        {error && (
          <Message negative>
            <Message.Header>No Items found in the cart.</Message.Header>
            <p>{JSON.stringify(error)}</p>
          </Message>
        )}

        {loading && (
          <Segment>
            <Dimmer active inverted>
              <Loader inverted content='Loading' />
            </Dimmer>

            <Image src='/images/wireframe/short-paragraph.png' />
          </Segment>
        )}

        {data && (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Item #</Table.HeaderCell>
                <Table.HeaderCell>Item name</Table.HeaderCell>
                <Table.HeaderCell>Item price</Table.HeaderCell>
                <Table.HeaderCell>Item quantity</Table.HeaderCell>
                <Table.HeaderCell>Item item price</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {data.order_items.map((order_item, i) => (
                <Table.Row key={order_item.id}>
                  <Table.Cell>{i + 1}</Table.Cell>
                  <Table.Cell>
                    {order_item.item.title} -{' '}
                    {this.renderVariations(order_item)}
                  </Table.Cell>
                  <Table.Cell>${order_item.item.price.toFixed(2)}</Table.Cell>
                  <Table.Cell textAlign='center'>
                    <Icon
                      name='plus'
                      style={{ float: 'right', cursor: 'pointer' }}
                      onClick={() =>
                        this.handleAddToCart(
                          order_item.item.slug,
                          order_item.item_variations
                        )
                      }
                    />
                    {order_item.quantity}
                    <Icon
                      name='minus'
                      style={{ float: 'left', cursor: 'pointer' }}
                      onClick={() =>
                        this.handleReduceQuantityFromCart(order_item.item.slug)
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    {order_item.item.discount_price && (
                      <Label color='green' ribbon>
                        @${order_item.item.discount_price}
                      </Label>
                    )}
                    {order_item.final_price.toFixed(2)}
                    <Icon
                      name='trash'
                      color='red'
                      style={{ float: 'right', cursor: 'pointer' }}
                      onClick={() => this.handleRemoveItem(order_item.id)}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}

              <Table.Row textAlign='center'>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell colSpan='2'>
                  Total: ${data.total.toFixed(2)}
                </Table.Cell>
              </Table.Row>
            </Table.Body>

            <Table.Footer>
              <Table.Row>
                <Table.HeaderCell colSpan='5' textAlign='right'>
                  <Link to='/checkout'>
                    <Button color='yellow'>Checkout</Button>
                  </Link>
                </Table.HeaderCell>
              </Table.Row>
            </Table.Footer>
          </Table>
        )}
      </Container>
    );
  }
}

export default OrderSummary;
